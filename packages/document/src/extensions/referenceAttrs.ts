import { Extension } from '@tiptap/core'

export const ReferenceAttrs = Extension.create({
  name: 'referenceAttrs',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          referenceId: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-reference-id') || null,
            renderHTML: (attributes) =>
              attributes.referenceId ? { 'data-reference-id': attributes.referenceId } : {},
          },
          verification: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-verification') || null,
            renderHTML: (attributes) =>
              attributes.verification ? { 'data-verification': attributes.verification } : {},
          },
          csl: {
            default: null,
            parseHTML: (element) => {
              const raw = element.getAttribute('data-csl')
              if (!raw) return null
              try {
                return JSON.parse(raw) as unknown
              } catch {
                return null
              }
            },
            renderHTML: (attributes) =>
              attributes.csl
                ? { 'data-csl': JSON.stringify(attributes.csl) }
                : {},
          },
          reviewKind: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-review-kind') || null,
            renderHTML: (attributes) =>
              attributes.reviewKind
                ? {
                    'data-review-kind': attributes.reviewKind,
                    class: `is-review-${attributes.reviewKind}`,
                  }
                : {},
          },
        },
      },
      {
        types: [
          'heading',
          'blockquote',
          'codeBlock',
          'bulletList',
          'orderedList',
          'taskList',
          'table',
          'horizontalRule',
          'image',
          'equation',
          'pageBreak',
          'tableOfContents',
        ],
        attributes: {
          reviewKind: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-review-kind') || null,
            renderHTML: (attributes) =>
              attributes.reviewKind
                ? {
                    'data-review-kind': attributes.reviewKind,
                    class: `is-review-${attributes.reviewKind}`,
                  }
                : {},
          },
        },
      },
    ]
  },
})
