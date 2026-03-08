import { visit } from 'unist-util-visit'

const TARGET_TAGS = new Set(['pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

export function rehypeRemoveTabindex() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (!TARGET_TAGS.has(node.tagName) || !node.properties) {
        return
      }

      delete node.properties.tabindex
      delete node.properties.tabIndex
    })
  }
}
