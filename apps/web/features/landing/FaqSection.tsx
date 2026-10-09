import { Plus } from 'lucide-react'
import { SectionHeading } from './SectionHeading'

const FAQS = [
  {
    question: 'How is PenPal different from using a chatbot?',
    answer:
      'A chatbot gives you text to paste somewhere else. In PenPal the AI works inside a real document editor — it creates headings, tables, citations, and page layout directly, and every change can be reviewed or undone.',
  },
  {
    question: 'Can I edit the document myself?',
    answer:
      'Yes. PenPal is a full editor with fonts, styles, page setup, find & replace, and more. Use AI as much or as little as you like.',
  },
  {
    question: 'What file formats can I export to?',
    answer: 'You can download any document as Word (.docx), Markdown, HTML, or plain text.',
  },
  {
    question: 'Can I work on a document with other people?',
    answer:
      'Yes. Share a document and collaborate in real time — everyone sees edits as they happen.',
  },
  {
    question: 'Is my writing private?',
    answer:
      'Your documents are only visible to you and the people you explicitly share them with.',
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1fr_1.4fr]">
        <SectionHeading
          align="left"
          eyebrow="FAQ"
          title="Questions, answered"
          description="Can't find what you're looking for? Reach out and we'll help."
        />
        <div className="divide-y divide-line rounded-3xl border border-line bg-white">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-forest [&::-webkit-details-marker]:hidden">
                {faq.question}
                <Plus className="h-4 w-4 shrink-0 text-leaf transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-3 text-[15px] leading-6 text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
