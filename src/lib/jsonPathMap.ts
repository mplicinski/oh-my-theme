import { EditorState } from '@codemirror/state'
import { syntaxTree } from '@codemirror/language'

export type JsonPathString = string

export interface PathInfo {
  key: string // object property name
  value: string // entire json path of the object property // in some cases just the object value path
  from: number // starting char of object property
  to: number // ending char of object property
  parentPath: JsonPathString // string path of parent node
}

/**
 * Builds a map of JSON with properties as keys and path strings with info of their position in the editor as values.
 */
export function buildPathMap(state: EditorState): Map<JsonPathString, PathInfo> {
  const map = new Map<JsonPathString, PathInfo>()
  const tree = syntaxTree(state)
  const text = state.doc.toString()

  function walk(node: any, pathStack: string[] = []) {
    if (!node) return

    // Handle object properties
    if (node.type.name === 'Property') {
      const keyNode = node.getChild('PropertyName')
      const valueNode = node.getChild('Value') ?? node.lastChild

      if (keyNode && valueNode) {
        const key = text.slice(keyNode.from + 1, keyNode.to - 1) // strip quotes
        const value = text.slice(valueNode.from, valueNode.to)
        const parentPath = pathStack.join('')
        const path = `${parentPath}.${key}`

        map.set(path, {
          from: node.from,
          to: node.to,
          key,
          parentPath,
          value,
        })

        // Recurse through nested structures
        if (valueNode.type.name === 'Object' || valueNode.type.name === 'Array') {
          walk(valueNode, [...pathStack, `.${key}`])
        }
      }

      return
    }

    if (node.type.name === 'Array') {
      let i = 0
      for (let child = node.firstChild; child; child = child.nextSibling) {
        if (child.type.name === 'Object' || child.type.name === 'Array') {
          const parentPath = pathStack.join('')
          const key = `[${i}]`
          const path = `${parentPath}${key}`

          map.set(path, {
            from: child.from,
            to: child.to,
            key,
            parentPath,
            value: text.slice(child.from, child.to),
          })

          walk(child, [...pathStack, key])
          i++
        }
      }

      return
    }

    // Recurse through child nodes
    for (let child = node.firstChild; child; child = child.nextSibling) {
      walk(child, pathStack)
    }
  }

  walk(tree.topNode)

  return map
}
