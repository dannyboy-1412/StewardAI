import { describe, expect, it } from 'vitest'
import { applyOp, applyOps } from './apply.js'
import { markdownToNodes, nodesToMarkdown } from './markdown.js'
import { toAgentView, searchDocument } from './agent-view.js'
import { documentOpSchema } from './ops.js'
import { emptyDoc, heading, paragraph, blockId, topLevelBlocks } from './tree.js'
import { validateOp } from './validate.js'
import { templateContent } from './templates.js'

describe('markdownToNodes', () => {
  it('parses headings, paragraphs, and lists', () => {
    const nodes = markdownToNodes('# Title\n\nHello **world**.\n\n- one\n- two')
    expect(nodes[0]?.type).toBe('heading')
    expect(nodes[1]?.type).toBe('paragraph')
    expect(nodes[2]?.type).toBe('bulletList')
    expect(nodes.every((node) => node.attrs?.id)).toBe(true)
  })

  it('round-trips a heading', () => {
    const nodes = markdownToNodes('## Methods')
    expect(nodesToMarkdown(nodes)).toContain('## Methods')
  })
})

describe('applyOps', () => {
  it('inserts blocks at the end', () => {
    const start = emptyDoc()
    const result = applyOp(start, {
      type: 'insertBlocks',
      position: 'end',
      markdown: '## Introduction\n\nRenewable energy matters.',
    })
    const types = topLevelBlocks(result.doc).map((block) => block.type)
    expect(types).toContain('heading')
    expect(result.affectedBlockIds.length).toBeGreaterThan(0)
  })

  it('replaces a paragraph', () => {
    const para = paragraph('old text')
    const doc = { type: 'doc', content: [para] }
    const id = blockId(para)!
    const result = applyOp(doc, {
      type: 'replaceBlocks',
      blockIds: [id],
      markdown: 'new text that is longer',
    })
    expect(nodesToMarkdown(topLevelBlocks(result.doc))).toContain('new text')
    expect(nodesToMarkdown(topLevelBlocks(result.doc))).not.toContain('old text')
  })

  it('moves a heading before another block', () => {
    const a = heading('A', 1)
    const b = heading('B', 1)
    const c = heading('C', 1)
    const doc = { type: 'doc', content: [a, b, c] }
    const result = applyOp(doc, {
      type: 'moveBlocks',
      blockIds: [blockId(c)!],
      afterBlockId: blockId(a)!,
    })
    const titles = topLevelBlocks(result.doc).map((node) =>
      node.content?.[0]?.text,
    )
    expect(titles).toEqual(['A', 'C', 'B'])
  })

  it('creates a table and updates a cell', () => {
    const start = emptyDoc()
    const created = applyOp(start, {
      type: 'createTable',
      headers: ['Source', 'Cost'],
      rows: [['Solar', '40']],
    })
    const tableId = blockId(topLevelBlocks(created.doc).at(-1)!)!
    const updated = applyOp(created.doc, {
      type: 'updateTableCells',
      tableId,
      cells: [{ row: 1, col: 1, text: '42' }],
    })
    expect(nodesToMarkdown(topLevelBlocks(updated.doc))).toContain('42')
  })

  it('adds a citation and a references section', () => {
    const para = paragraph('Renewables grew quickly.')
    const doc = { type: 'doc', content: [para] }
    const result = applyOp(doc, {
      type: 'addCitation',
      blockId: blockId(para)!,
      source: { title: 'IEA Outlook', authors: 'IEA', year: '2023' },
    })
    const markdown = nodesToMarkdown(topLevelBlocks(result.doc))
    expect(markdown).toContain('References')
    expect(markdown).toContain('IEA Outlook')
  })
})

describe('validateOp', () => {
  it('rejects unknown block ids', () => {
    const errors = validateOp(emptyDoc(), {
      type: 'deleteBlocks',
      blockIds: ['missing'],
    })
    expect(errors.length).toBe(1)
  })

  it('parses a valid op', () => {
    const op = documentOpSchema.parse({
      type: 'insertBlocks',
      markdown: 'Hello',
      position: 'end',
    })
    expect(op.type).toBe('insertBlocks')
  })
})

describe('toAgentView', () => {
  it('includes block ids the model can target', () => {
    const doc = templateContent('essay')
    const view = toAgentView(doc)
    expect(view).toContain('## Outline')
    expect(view).toContain('Introduction')
    const firstId = blockId(topLevelBlocks(doc)[0]!)
    expect(view).toContain(`[${firstId}]`)
  })

  it('searches block text', () => {
    const hits = searchDocument(templateContent('research-report'), 'methodology')
    expect(hits.length).toBeGreaterThan(0)
  })
})

describe('applyOps batch', () => {
  it('applies a create-then-format sequence', () => {
    const { doc } = applyOps(emptyDoc(), [
      { type: 'insertBlocks', position: 'end', markdown: 'Title line' },
      {
        type: 'createSection',
        heading: 'Introduction',
        level: 1,
        markdown: 'A first paragraph.',
      },
    ])
    expect(toAgentView(doc)).toContain('Introduction')
  })
})
