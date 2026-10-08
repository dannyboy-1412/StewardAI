import type { TemplateId } from '@docai/shared'
import { heading, paragraph, tableNode, emptyDoc } from './tree.js'
import type { JSONContent } from './types.js'

function doc(...content: JSONContent[]): JSONContent {
  return { type: 'doc', content }
}

export function templateContent(templateId: TemplateId): JSONContent {
  switch (templateId) {
    case 'research-report':
      return doc(
        heading('Research Report Title', 1),
        paragraph('Author · Course · Date'),
        heading('Abstract', 1),
        paragraph(
          'Summarise the research question, methods, key findings, and implications in 150–250 words.',
        ),
        heading('1. Introduction', 1),
        paragraph(
          'State the problem, why it matters, and the question this report answers.',
        ),
        heading('2. Literature Review', 1),
        paragraph('Synthesise the most relevant prior work and identify the gap you address.'),
        heading('3. Methodology', 1),
        paragraph('Describe data, methods, and limitations clearly enough to replicate.'),
        heading('4. Findings', 1),
        paragraph('Present results without interpretation. Use tables or figures where useful.'),
        heading('5. Discussion', 1),
        paragraph('Interpret findings against the literature and note practical implications.'),
        heading('6. Conclusion', 1),
        paragraph('Restate the contribution and suggest next steps.'),
        heading('References', 1),
        paragraph('Add citations as you write. AI can insert them from your source files.'),
      )
    case 'essay':
      return doc(
        heading('Essay Title', 1),
        paragraph('Name · Course · Date'),
        heading('Introduction', 1),
        paragraph('Hook, context, and a clear thesis statement.'),
        heading('Body', 1),
        paragraph('Develop one idea per paragraph. Use topic sentences and evidence.'),
        heading('Counterargument', 1),
        paragraph('Address the strongest objection, then return to your thesis.'),
        heading('Conclusion', 1),
        paragraph('Do not only repeat the thesis — show what follows from it.'),
        heading('References', 1),
        paragraph(''),
      )
    case 'project-proposal':
      return doc(
        heading('Project Proposal', 1),
        heading('1. Overview', 2),
        paragraph('What will be built, for whom, and why now.'),
        heading('2. Objectives', 2),
        paragraph('List measurable outcomes.'),
        heading('3. Scope', 2),
        paragraph('In scope and out of scope.'),
        heading('4. Timeline', 2),
        tableNode(
          ['Phase', 'Deliverable', 'Target date'],
          [
            ['Discovery', 'Requirements brief', 'Week 1'],
            ['Build', 'Working prototype', 'Week 4'],
            ['Review', 'Final report', 'Week 6'],
          ],
        ),
        heading('5. Risks', 2),
        paragraph('Name the main risks and how you will mitigate them.'),
        heading('6. Resources', 2),
        paragraph('People, tools, and budget.'),
      )
    case 'case-study':
      return doc(
        heading('Case Study Title', 1),
        heading('Context', 1),
        paragraph('Organisation, audience, and the situation that prompted the work.'),
        heading('Challenge', 1),
        paragraph('The constraint or problem that had to be solved.'),
        heading('Approach', 1),
        paragraph('What you did, in what order, and why those choices.'),
        heading('Results', 1),
        tableNode(
          ['Metric', 'Before', 'After'],
          [
            ['Outcome 1', '—', '—'],
            ['Outcome 2', '—', '—'],
          ],
        ),
        heading('Lessons', 1),
        paragraph('What you would repeat, and what you would change.'),
      )
    default:
      return emptyDoc()
  }
}

export function defaultTitle(templateId: TemplateId): string {
  switch (templateId) {
    case 'research-report':
      return 'Untitled research report'
    case 'essay':
      return 'Untitled essay'
    case 'project-proposal':
      return 'Untitled project proposal'
    case 'case-study':
      return 'Untitled case study'
    default:
      return 'Untitled document'
  }
}
