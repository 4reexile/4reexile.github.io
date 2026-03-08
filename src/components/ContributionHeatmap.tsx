import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

interface ContributionDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

interface ContributionResponse {
  total: Record<string, number>
  contributions: ContributionDay[]
}

interface Props {
  username: string
}

interface ContributionCache {
  cachedAt: number
  expiresAt: number
  data: ContributionResponse
}

const CACHE_KEY_PREFIX = 'gh-contrib:v1:'
const CACHE_TTL_MS = 12 * 60 * 60 * 1000

function generatePlaceholder(days = 371): ContributionDay[] {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(Date.now() - (days - index) * 24 * 60 * 60 * 1000)
    return {
      date: date.toISOString().split('T')[0],
      count: 0,
      level: 0,
    }
  })
}

const levelClassMap: Record<number, string> = {
  0: 'bg-zinc-200/80 dark:bg-zinc-700/70',
  1: 'bg-emerald-200 dark:bg-emerald-900/80',
  2: 'bg-emerald-300 dark:bg-emerald-700/90',
  3: 'bg-emerald-500 dark:bg-emerald-500/90',
  4: 'bg-emerald-700 dark:bg-emerald-300',
}

function getCacheKey(username: string) {
  return `${CACHE_KEY_PREFIX}${username.toLowerCase()}`
}

function isValidResponse(data: unknown): data is ContributionResponse {
  if (!data || typeof data !== 'object') return false
  const maybe = data as ContributionResponse
  return Array.isArray(maybe.contributions) && typeof maybe.total === 'object' && maybe.total !== null
}

function readCache(username: string): ContributionCache | null {
  try {
    const raw = localStorage.getItem(getCacheKey(username))
    if (!raw) return null

    const parsed = JSON.parse(raw) as ContributionCache
    const isMetaValid =
      typeof parsed?.cachedAt === 'number' && typeof parsed?.expiresAt === 'number' && isValidResponse(parsed?.data)

    if (!isMetaValid) {
      localStorage.removeItem(getCacheKey(username))
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function writeCache(username: string, data: ContributionResponse) {
  try {
    const now = Date.now()
    const payload: ContributionCache = {
      cachedAt: now,
      expiresAt: now + CACHE_TTL_MS,
      data,
    }
    localStorage.setItem(getCacheKey(username), JSON.stringify(payload))
  } catch {
    // Ignore quota/storage errors and continue without cache.
  }
}

function applyContributionData(
  data: ContributionResponse,
  setDays: Dispatch<SetStateAction<ContributionDay[]>>,
  setTotal: Dispatch<SetStateAction<number>>,
) {
  setDays(data.contributions)
  setTotal(data.total.lastYear ?? 0)
}

export function ContributionHeatmap({ username }: Props) {
  const [days, setDays] = useState<ContributionDay[]>(() => generatePlaceholder())
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let active = true

    const cache = readCache(username)
    const now = Date.now()
    const hasFreshCache = !!cache && cache.expiresAt > now

    if (cache) {
      applyContributionData(cache.data, setDays, setTotal)
    }

    if (hasFreshCache) {
      return () => {
        active = false
      }
    }

    async function load() {
      try {
        const response = await fetch(
          `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`,
          { referrerPolicy: 'no-referrer' },
        )

        if (!response.ok) {
          throw new Error('Failed to fetch contribution data')
        }

        const data = (await response.json()) as ContributionResponse
        if (!active) return

        if (!isValidResponse(data)) {
          throw new Error('Invalid contribution response')
        }

        applyContributionData(data, setDays, setTotal)
        writeCache(username, data)
      } catch {
        if (!active) return
        if (!cache) {
          setDays(generatePlaceholder())
          setTotal(0)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [username])

  const weeks = useMemo(() => {
    return days.reduce<ContributionDay[][]>((acc, day, index) => {
      const weekIndex = Math.floor(index / 7)
      if (!acc[weekIndex]) {
        acc[weekIndex] = []
      }
      acc[weekIndex].push(day)
      return acc
    }, [])
  }, [days])

  return (
    <section className="rounded-lg bg-accent/5 border border-primary p-4 md:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-lg font-bold">GitHub 贡献热力图</h2>
        <span className="text-xs text-secondary">过去一年 {total} 次贡献</span>
      </div>
      <div className="w-full">
        <div className="grid grid-flow-col auto-cols-fr gap-[3px] w-full">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-rows-7 gap-[3px] min-w-0">
              {week.map((day, dayIndex) => {
                const title = `${day.date}: ${day.count} contributions`
                return (
                  <div
                    key={`${day.date}-${dayIndex}`}
                    title={title}
                    aria-label={title}
                    className={`w-full aspect-square rounded-[2px] transition-colors ${levelClassMap[day.level] ?? levelClassMap[0]}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
