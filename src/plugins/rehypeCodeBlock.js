import { h } from 'hastscript'
import { visit } from 'unist-util-visit'

export function rehypeCodeBlock() {
  return function (tree) {
    visit(tree, { tagName: 'pre' }, (node, index, parent) => {
      const child = node.children[0]
      if (!child || child.type !== 'element' || child.tagName !== 'code' || !child.properties) {
        return
      }

      const classes = child.properties.className
      let lang = ''
      if (!classes) {
        node.children[0].properties = {
          className: ['language-text'],
        }
        lang = 'text'
      } else {
        lang = classes[0].slice(9)
      }

      const codeBlock = h(
        'div',
        {
          class: 'code-block',
          'data-collapsed': 'false',
          'data-collapsible': 'false',
        },
        [
          h(
            'button',
            {
              class: 'code-copy-btn',
              type: 'button',
              'aria-label': 'Copy code block',
              'data-state': 'idle',
            },
            [
              h('i', { class: 'iconfont icon-file-list code-copy-icon code-copy-icon-idle' }),
              h('i', { class: 'iconfont icon-check code-copy-icon code-copy-icon-success' }),
              h('i', { class: 'iconfont icon-close code-copy-icon code-copy-icon-error' }),
              h('span', { class: 'code-copy-text' }, '已复制'),
            ],
          ),
          h('span', { class: 'lang-tag' }, lang),
          node,
          h(
            'button',
            {
              class: 'code-fold-btn',
              type: 'button',
              'aria-label': 'Expand code block',
            },
            [h('i', { class: 'iconfont icon-down code-fold-icon' })],
          ),
        ],
      )

      parent.children[index] = codeBlock
    })
  }
}
