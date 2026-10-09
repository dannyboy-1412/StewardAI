import { describe, expect, it, vi } from 'vitest'
import { TiptapTransformer } from '@hocuspocus/transformer'
import { applyOp, applyOps } from './apply.js'
import { markdownToNodes, nodesToMarkdown } from './markdown.js'
import { toAgentView, searchDocument } from './agent-view.js'
import { documentOpSchema } from './ops.js'
import { applyPatches, BlockNotFoundError } from './patches.js'
import { emptyDoc, heading, paragraph, blockId, cloneDoc, topLevelBlocks } from './tree.js'
import { validateOp } from './validate.js'
import { templateContent } from './templates.js'
import { createEditorExtensions } from './extensions.js'
import * as ids from './ids.js'
import type { JSONContent } from './types.js'

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

describe('task lists and formatting ops', () => {
  it('parses markdown checklists', () => {
    const nodes = markdownToNodes('- [ ] Draft outline\n- [x] Collect sources')
    expect(nodes[0]?.type).toBe('taskList')
    expect(nodesToMarkdown(nodes)).toContain('[ ]')
    expect(nodesToMarkdown(nodes)).toContain('[x]')
  })

  it('formats heading level, alignment, and spacing', () => {
    const para = paragraph('Title line')
    const doc = { type: 'doc', content: [para] }
    const id = blockId(para)!
    const result = applyOp(doc, {
      type: 'formatBlocks',
      blockIds: [id],
      headingLevel: 6,
      alignment: 'center',
      lineHeight: '1.5',
      indent: 2,
    })
    const next = topLevelBlocks(result.doc)[0]
    expect(next?.type).toBe('heading')
    expect(next?.attrs?.level).toBe(6)
    expect(next?.attrs?.textAlign).toBe('center')
    expect(next?.attrs?.lineHeight).toBe('1.5')
    expect(next?.attrs?.indent).toBe(2)
  })

  it('styles matching text without rewriting the block', () => {
    const para = paragraph('Hello world')
    const doc = { type: 'doc', content: [para] }
    const result = applyOp(doc, {
      type: 'styleText',
      blockIds: [blockId(para)!],
      match: 'world',
      fontFamily: 'Georgia',
      fontSize: '14pt',
      bold: true,
    })
    const view = toAgentView(result.doc)
    expect(view).toContain('font:Georgia 14pt')
    expect(nodesToMarkdown(topLevelBlocks(result.doc))).toContain('Hello **world**')
  })

  it('clears formatting and inserts a page break and table of contents', () => {
    const para = paragraph('Keep this wording')
    para.attrs = { ...para.attrs, textAlign: 'center', lineHeight: '2' }
    const start = { type: 'doc', content: [para] }
    const styled = applyOp(start, {
      type: 'styleText',
      blockIds: [blockId(para)!],
      color: '#ff0000',
    })
    const cleared = applyOp(styled.doc, {
      type: 'clearFormatting',
      blockIds: [blockId(para)!],
    })
    expect(cleared.doc.content?.[0]?.attrs?.textAlign).toBeUndefined()
    const withBreak = applyOp(cleared.doc, { type: 'insertPageBreak', afterBlockId: blockId(para)! })
    const withToc = applyOp(withBreak.doc, { type: 'insertTableOfContents', afterBlockId: blockId(para)! })
    const types = topLevelBlocks(withToc.doc).map((block) => block.type)
    expect(types).toContain('pageBreak')
    expect(types).toContain('tableOfContents')
  })

  it('preserves block layout when replacing one paragraph with one paragraph', () => {
    const para = paragraph('old')
    para.attrs = { ...para.attrs, textAlign: 'right', indent: 1 }
    const result = applyOp(
      { type: 'doc', content: [para] },
      { type: 'replaceBlocks', blockIds: [blockId(para)!], markdown: 'new wording' },
    )
    const next = topLevelBlocks(result.doc)[0]
    expect(next?.attrs?.textAlign).toBe('right')
    expect(next?.attrs?.indent).toBe(1)
    expect(nodesToMarkdown([next!])).toContain('new wording')
  })
})

describe('schema round-trip', () => {
  it('round-trips fonts, sizes, and page breaks through a Y.Doc', () => {
    const doc: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { id: 'p1', textAlign: 'center', lineHeight: '1.5' },
          content: [
            {
              type: 'text',
              text: 'Hello',
              marks: [{ type: 'textStyle', attrs: { fontFamily: 'Georgia', fontSize: '14pt' } }],
            },
          ],
        },
        { type: 'pageBreak', attrs: { id: 'br1' } },
      ],
    }
    const extensions = createEditorExtensions({ history: false, uniqueId: false })
    const ydoc = TiptapTransformer.toYdoc(doc, 'default', extensions)
    const json = TiptapTransformer.fromYdoc(ydoc, 'default')
    const serialized = JSON.stringify(json)
    expect(serialized).toContain('Georgia')
    expect(serialized).toContain('14pt')
    expect(serialized).toContain('pageBreak')
    expect(serialized).toContain('center')
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

describe('deterministic patches', () => {
  it('applies resolved patches to two clones with identical ids', () => {
    const start = emptyDoc()
    const { patches, doc } = applyOp(start, {
      type: 'insertBlocks',
      position: 'end',
      markdown: '# Title\n\nBody copy.',
    })
    const replicaA = applyPatches(cloneDoc(start), patches)
    const replicaB = applyPatches(cloneDoc(start), patches)
    expect(replicaA).toEqual(replicaB)
    expect(replicaA).toEqual(doc)
  })

  it('replays an outline-then-fill sequence on a replica without throwing', () => {
    const start = emptyDoc()
    const overview = applyOp(start, {
      type: 'createSection',
      heading: 'Overview',
      level: 1,
      markdown: '',
    })
    const headingId = overview.affectedBlockIds[0]
    expect(headingId).toBeTruthy()
    const filled = applyOp(overview.doc, {
      type: 'insertBlocks',
      afterBlockId: headingId,
      markdown: 'The new Polo is a compact hatchback.',
    })
    const lastBodyId = filled.affectedBlockIds.at(-1)
    const design = applyOp(filled.doc, {
      type: 'createSection',
      afterBlockId: lastBodyId,
      heading: 'Design',
      level: 1,
      markdown: 'Clean lines and a digital cockpit.',
    })
    const allPatches = [...overview.patches, ...filled.patches, ...design.patches]
    const replica = applyPatches(cloneDoc(start), allPatches)
    expect(replica).toEqual(design.doc)
    expect(toAgentView(replica)).toContain('Overview')
    expect(toAgentView(replica)).toContain('Design')
  })

  it('does not call createBlockId', () => {
    const start = emptyDoc()
    const { patches } = applyOp(start, {
      type: 'createSection',
      heading: 'Intro',
      level: 1,
      markdown: 'Hello there.',
    })
    const spy = vi.spyOn(ids, 'createBlockId')
    applyPatches(cloneDoc(start), patches)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('throws BlockNotFoundError for a missing insert anchor', () => {
    expect(() =>
      applyPatches(emptyDoc(), [
        {
          type: 'insert',
          afterBlockId: 'missing',
          nodes: [paragraph('orphan')],
        },
      ]),
    ).toThrow(BlockNotFoundError)
  })
})
