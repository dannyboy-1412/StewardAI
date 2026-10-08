import { marked, type Token, type Tokens } from 'marked'
import { createBlockId } from './ids.js'
import type { JSONContent } from './types.js'
import { paragraph, tableNode } from './tree.js'

function inlineToContent(tokens: Token[] | undefined): JSONContent[] | undefined {
  if (!tokens || tokens.length === 0) return undefined
  const content: JSONContent[] = []

  const pushText = (text: string, marks?: JSONContent['marks']) => {
    if (!text) return
    content.push(marks ? { type: 'text', text, marks } : { type: 'text', text })
  }

  const walk = (inner: Token[], inherited: JSONContent['marks'] = []) => {
    for (const token of inner) {
      switch (token.type) {
        case 'text': {
          const textToken = token as Tokens.Text
          if (textToken.tokens) {
            walk(textToken.tokens, inherited)
          } else {
            pushText(textToken.text, inherited.length ? inherited : undefined)
          }
          break
        }
        case 'strong':
          walk((token as Tokens.Strong).tokens ?? [], [
            ...inherited,
            { type: 'bold' },
          ])
          break
        case 'em':
          walk((token as Tokens.Em).tokens ?? [], [
            ...inherited,
            { type: 'italic' },
          ])
          break
        case 'codespan':
          pushText((token as Tokens.Codespan).text, [
            ...inherited,
            { type: 'code' },
          ])
          break
        case 'del':
          walk((token as Tokens.Del).tokens ?? [], [
            ...inherited,
            { type: 'strike' },
          ])
          break
        case 'link': {
          const link = token as Tokens.Link
          walk(link.tokens ?? [{ type: 'text', text: link.text } as Token], [
            ...inherited,
            { type: 'link', attrs: { href: link.href } },
          ])
          break
        }
        case 'br':
          content.push({ type: 'hardBreak' })
          break
        default:
          if ('text' in token && typeof token.text === 'string') {
            pushText(token.text, inherited.length ? inherited : undefined)
          }
      }
    }
  }

  walk(tokens)
  return content.length ? content : undefined
}

function listNode(token: Tokens.List): JSONContent {
  return {
    type: token.ordered ? 'orderedList' : 'bulletList',
    attrs: { id: createBlockId(), start: token.start || undefined },
    content: token.items.map((item) => ({
      type: 'listItem',
      content: item.tokens?.length
        ? markdownToNodesFromTokens(item.tokens).map((node) =>
            node.type === 'paragraph' || node.type === 'bulletList' || node.type === 'orderedList'
              ? node
              : paragraph(textFromTokens(item.tokens)),
          )
        : [paragraph(item.text)],
    })),
  }
}

function textFromTokens(tokens: Token[] | undefined): string {
  if (!tokens) return ''
  return tokens
    .map((token) => ('text' in token && typeof token.text === 'string' ? token.text : ''))
    .join('')
}

function markdownToNodesFromTokens(tokens: Token[]): JSONContent[] {
  const nodes: JSONContent[] = []

  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        const headingToken = token as Tokens.Heading
        nodes.push({
          type: 'heading',
          attrs: { id: createBlockId(), level: Math.min(headingToken.depth, 3) },
          content: inlineToContent(headingToken.tokens),
        })
        break
      }
      case 'paragraph': {
        const paragraphToken = token as Tokens.Paragraph
        nodes.push({
          type: 'paragraph',
          attrs: { id: createBlockId() },
          content: inlineToContent(paragraphToken.tokens),
        })
        break
      }
      case 'blockquote': {
        const quote = token as Tokens.Blockquote
        nodes.push({
          type: 'blockquote',
          attrs: { id: createBlockId() },
          content: markdownToNodesFromTokens(quote.tokens),
        })
        break
      }
      case 'code': {
        const code = token as Tokens.Code
        nodes.push({
          type: 'codeBlock',
          attrs: { id: createBlockId(), language: code.lang ?? null },
          content: code.text ? [{ type: 'text', text: code.text }] : undefined,
        })
        break
      }
      case 'list':
        nodes.push(listNode(token as Tokens.List))
        break
      case 'table': {
        const table = token as Tokens.Table
        const headers = table.header.map((cell) => cell.text)
        const rows = table.rows.map((row) => row.map((cell) => cell.text))
        nodes.push(tableNode(headers, rows))
        break
      }
      case 'hr':
        nodes.push({
          type: 'horizontalRule',
          attrs: { id: createBlockId() },
        })
        break
      case 'space':
        break
      default:
        if ('text' in token && typeof token.text === 'string' && token.text.trim()) {
          nodes.push(paragraph(token.text))
        }
    }
  }

  return nodes
}

export function markdownToNodes(markdown: string): JSONContent[] {
  const trimmed = markdown.trim()
  if (!trimmed) return [paragraph('')]
  const tokens = marked.lexer(trimmed)
  const nodes = markdownToNodesFromTokens(tokens)
  return nodes.length > 0 ? nodes : [paragraph(trimmed)]
}

export function nodesToMarkdown(nodes: JSONContent[]): string {
  return nodes.map(nodeToMarkdown).filter(Boolean).join('\n\n')
}

function nodeToMarkdown(node: JSONContent): string {
  switch (node.type) {
    case 'heading': {
      const level = Number(node.attrs?.level ?? 1)
      return `${'#'.repeat(level)} ${inlineMarkdown(node)}`
    }
    case 'paragraph':
      return inlineMarkdown(node)
    case 'blockquote':
      return (node.content ?? [])
        .map(nodeToMarkdown)
        .filter(Boolean)
        .map((line) => `> ${line}`)
        .join('\n')
    case 'codeBlock':
      return `\`\`\`${node.attrs?.language ?? ''}\n${textOfNode(node)}\n\`\`\``
    case 'bulletList':
      return (node.content ?? [])
        .map((item) => `- ${textOfNode(item)}`)
        .join('\n')
    case 'orderedList':
      return (node.content ?? [])
        .map((item, index) => `${index + 1}. ${textOfNode(item)}`)
        .join('\n')
    case 'table':
      return tableToMarkdown(node)
    case 'horizontalRule':
      return '---'
    case 'image':
      return `![${node.attrs?.alt ?? ''}](${node.attrs?.src ?? ''})`
    case 'equation':
      return `$$\n${node.attrs?.latex ?? ''}\n$$`
    default:
      return textOfNode(node)
  }
}

function tableToMarkdown(node: JSONContent): string {
  const rows = node.content ?? []
  const texts = rows.map((row) =>
    (row.content ?? []).map((cellNode) => textOfNode(cellNode).replace(/\|/g, '\\|')),
  )
  if (texts.length === 0) return ''
  const header = texts[0] ?? []
  const divider = header.map(() => '---')
  const lines = [
    `| ${header.join(' | ')} |`,
    `| ${divider.join(' | ')} |`,
    ...texts.slice(1).map((row) => `| ${row.join(' | ')} |`),
  ]
  return lines.join('\n')
}

function inlineMarkdown(node: JSONContent): string {
  if (node.text) {
    return applyMarks(node.text, node.marks)
  }
  return (node.content ?? []).map(inlineMarkdown).join('')
}

function applyMarks(text: string, marks: JSONContent['marks']): string {
  if (!marks || marks.length === 0) return text
  return marks.reduce((value, mark) => {
    switch (mark.type) {
      case 'bold':
        return `**${value}**`
      case 'italic':
        return `*${value}*`
      case 'strike':
        return `~~${value}~~`
      case 'code':
        return `\`${value}\``
      case 'link':
        return `[${value}](${mark.attrs?.href ?? ''})`
      default:
        return value
    }
  }, text)
}

function textOfNode(node: JSONContent): string {
  if (node.text) return node.text
  return (node.content ?? []).map(textOfNode).join('')
}
