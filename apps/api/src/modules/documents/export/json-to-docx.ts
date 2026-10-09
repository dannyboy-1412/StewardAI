import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  PageBreak as DocxPageBreak,
  PageNumber,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import type { JSONContent, JSONMark, PageSettings } from '@docai/document'

const HEADING: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
}

function ptToHalfPoints(size: string | undefined): number | undefined {
  if (!size) return undefined
  const value = Number.parseFloat(size)
  if (!Number.isFinite(value)) return undefined
  return Math.round(value * 2)
}

function colorHex(value: string | undefined): string | undefined {
  if (!value) return undefined
  return value.replace('#', '')
}

function alignmentOf(node: JSONContent) {
  const align = node.attrs?.textAlign
  if (align === 'center') return AlignmentType.CENTER
  if (align === 'right') return AlignmentType.RIGHT
  if (align === 'justify') return AlignmentType.JUSTIFIED
  return AlignmentType.LEFT
}

function runsFrom(node: JSONContent, inherited: JSONMark[] = []): TextRun[] {
  if (node.type === 'hardBreak') return [new TextRun({ break: 1 })]
  if (node.text !== undefined) {
    const marks = [...inherited, ...(node.marks ?? [])]
    const textStyle = marks.find((mark) => mark.type === 'textStyle')?.attrs
    return [
      new TextRun({
        text: node.text,
        bold: marks.some((mark) => mark.type === 'bold'),
        italics: marks.some((mark) => mark.type === 'italic'),
        underline: marks.some((mark) => mark.type === 'underline') ? {} : undefined,
        strike: marks.some((mark) => mark.type === 'strike'),
        superScript: marks.some((mark) => mark.type === 'superscript'),
        subScript: marks.some((mark) => mark.type === 'subscript'),
        font: typeof textStyle?.fontFamily === 'string' ? textStyle.fontFamily : 'Arial',
        size: ptToHalfPoints(typeof textStyle?.fontSize === 'string' ? textStyle.fontSize : '11pt'),
        color: colorHex(typeof textStyle?.color === 'string' ? textStyle.color : undefined),
      }),
    ]
  }
  return (node.content ?? []).flatMap((child) =>
    runsFrom(child, [...inherited, ...(node.marks ?? [])]),
  )
}

function paragraphFrom(
  node: JSONContent,
  extra: { heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel] } = {},
): Paragraph {
  const children = runsFrom(node)
  return new Paragraph({
    heading: extra.heading,
    alignment: alignmentOf(node),
    spacing: {
      line:
        typeof node.attrs?.lineHeight === 'string'
          ? Math.round(Number.parseFloat(String(node.attrs.lineHeight)) * 240)
          : 276,
      before:
        typeof node.attrs?.spaceBefore === 'number' ? Math.round(node.attrs.spaceBefore * 20) : undefined,
      after:
        typeof node.attrs?.spaceAfter === 'number' ? Math.round(node.attrs.spaceAfter * 20) : undefined,
    },
    indent:
      typeof node.attrs?.indent === 'number' && node.attrs.indent > 0
        ? { left: Number(node.attrs.indent) * 720 }
        : undefined,
    children: children.length > 0 ? children : [new TextRun('')],
  })
}

function tableFrom(node: JSONContent): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: (node.content ?? []).map(
      (row) =>
        new TableRow({
          children: (row.content ?? []).map(
            (cell) =>
              new TableCell({
                children:
                  (cell.content ?? []).length > 0
                    ? (cell.content ?? []).map((block) => paragraphFrom(block))
                    : [new Paragraph('')],
              }),
          ),
        }),
    ),
  })
}

function childrenFrom(node: JSONContent): Array<Paragraph | Table> {
  switch (node.type) {
    case 'heading':
      return [
        paragraphFrom(node, {
          heading: HEADING[Number(node.attrs?.level ?? 1)] ?? HeadingLevel.HEADING_1,
        }),
      ]
    case 'paragraph':
      return [paragraphFrom(node)]
    case 'blockquote':
      return (node.content ?? []).flatMap((child) => childrenFrom(child))
    case 'codeBlock':
      return [
        new Paragraph({
          children: [
            new TextRun({
              text: node.content?.map((child) => child.text ?? '').join('') ?? '',
              font: 'Courier New',
            }),
          ],
        }),
      ]
    case 'bulletList':
      return (node.content ?? []).map(
        (item) => new Paragraph({ children: [new TextRun('• '), ...runsFrom(item)] }),
      )
    case 'orderedList':
      return (node.content ?? []).map(
        (item, index) =>
          new Paragraph({ children: [new TextRun(`${index + 1}. `), ...runsFrom(item)] }),
      )
    case 'taskList':
      return (node.content ?? []).map(
        (item) =>
          new Paragraph({
            children: [new TextRun(item.attrs?.checked ? '☑ ' : '☐ '), ...runsFrom(item)],
          }),
      )
    case 'table':
      return [tableFrom(node)]
    case 'horizontalRule':
      return [
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' } },
        }),
      ]
    case 'pageBreak':
      return [new Paragraph({ children: [new DocxPageBreak()] })]
    case 'tableOfContents':
      return [new Paragraph({ children: [new TextRun({ text: 'Table of contents', italics: true })] })]
    case 'equation':
      return [
        new Paragraph({
          children: [new TextRun({ text: String(node.attrs?.latex ?? ''), italics: true })],
        }),
      ]
    case 'image':
      return [
        new Paragraph({
          children: [
            new TextRun(typeof node.attrs?.alt === 'string' && node.attrs.alt ? node.attrs.alt : '[image]'),
          ],
        }),
      ]
    default:
      return [paragraphFrom(node)]
  }
}

export async function jsonToDocxBuffer(
  doc: JSONContent,
  settings: PageSettings,
  title: string,
): Promise<Buffer> {
  const a4 = { width: 11906, height: 16838 }
  const letter = { width: 12240, height: 15840 }
  const paper = settings.paperSize === 'Letter' ? letter : a4
  const landscape = settings.orientation === 'landscape'
  const children = (doc.content ?? []).flatMap(childrenFrom)

  const document = new Document({
    title,
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: 22 },
        },
      },
    },
    sections: [
      {
        headers: {
          default: new Header({
            children: [new Paragraph(settings.headerText || '')],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun(settings.footerText ? `${settings.footerText}  ` : ''),
                  ...(settings.showPageNumbers ? [new TextRun({ children: [PageNumber.CURRENT] })] : []),
                ],
              }),
            ],
          }),
        },
        properties: {
          page: {
            size: {
              width: landscape ? paper.height : paper.width,
              height: landscape ? paper.width : paper.height,
              orientation: landscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
            },
            margin: {
              top: Math.round(settings.marginTop * 1440),
              bottom: Math.round(settings.marginBottom * 1440),
              left: Math.round(settings.marginLeft * 1440),
              right: Math.round(settings.marginRight * 1440),
            },
          },
        },
        children: children.length > 0 ? children : [new Paragraph('')],
      },
    ],
  })

  const buffer = await Packer.toBuffer(document)
  return Buffer.from(buffer)
}
