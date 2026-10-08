import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

export async function extractText(
  buffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<string> {
  const lower = filename.toLowerCase()
  if (mimeType.startsWith('text/') || lower.endsWith('.md') || lower.endsWith('.txt')) {
    return buffer.toString('utf8')
  }
  if (mimeType === 'application/pdf' || lower.endsWith('.pdf')) {
    const pdfParse = (await import('pdf-parse')).default as (data: Buffer) => Promise<{ text: string }>
    const result = await pdfParse(buffer)
    return result.text
  }
  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lower.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    lower.endsWith('.xlsx') ||
    lower.endsWith('.xls')
  ) {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    return workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name]
      if (!sheet) return ''
      return `# ${name}\n${XLSX.utils.sheet_to_csv(sheet)}`
    }).join('\n\n')
  }
  return `[Binary file: ${filename}]`
}
