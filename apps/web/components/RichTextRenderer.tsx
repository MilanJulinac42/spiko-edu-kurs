'use client'

import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

/**
 * Read-only TipTap render — koristi se na student strani.
 * Renderujemo kroz TipTap (ne dangerouslySetInnerHTML) da izbegnemo XSS.
 */
export function RichTextRenderer({ html }: { html: string }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } })],
    content: html,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'tiptap-reader' },
    },
  })

  if (!editor) return null

  return (
    <div>
      <EditorContent editor={editor} />
      <style>{`
        .tiptap-reader { font-size: 1.05rem; line-height: 1.7; color: rgba(14, 22, 34, 0.85); }

        /* ── Naslovi sa akcentom ── */
        .tiptap-reader h2 {
          font-family: var(--font-display);
          font-size: 1.6rem; font-weight: 800;
          margin: 2.2rem 0 0.9rem; color: #0e1622;
        }
        .tiptap-reader h2:first-child { margin-top: 0; }
        .tiptap-reader h3 {
          font-family: var(--font-display);
          font-size: 1.2rem; font-weight: 700;
          margin: 1.8rem 0 0.7rem; color: #0e1622;
          padding-left: 0.7rem;
          border-left: 3px solid #86c440;
        }

        .tiptap-reader p { margin: 0.75rem 0; }

        /* ── Liste kao "grupe reči" — blaga surface kartica ── */
        .tiptap-reader ul, .tiptap-reader ol {
          margin: 0.9rem 0;
          padding: 0.9rem 1.25rem 0.9rem 2.5rem;
          background: #f7faf4;
          border: 1px solid rgba(14, 22, 34, 0.06);
          border-radius: 14px;
        }
        .tiptap-reader li { margin: 0.45rem 0; }
        .tiptap-reader li::marker { color: #86c440; }

        /* ── Naglašena reč + prevod ── */
        .tiptap-reader strong { font-weight: 700; color: #0e1622; }
        .tiptap-reader em { font-style: italic; font-weight: 400; color: #5b6675; }

        /* ── Callout / napomena (blockquote) ── */
        .tiptap-reader blockquote {
          margin: 1.4rem 0;
          padding: 1rem 1.25rem;
          background: linear-gradient(135deg, rgba(134, 196, 64, 0.1), rgba(62, 143, 208, 0.06));
          border: 1px solid rgba(134, 196, 64, 0.25);
          border-left: 4px solid #86c440;
          border-radius: 12px;
          color: #1c2a3d;
          font-style: normal;
        }
        .tiptap-reader blockquote p { margin: 0.3rem 0; }
        .tiptap-reader blockquote p:first-child { margin-top: 0; }
        .tiptap-reader blockquote p:last-child { margin-bottom: 0; }

        /* ── Kod / hr ── */
        .tiptap-reader code {
          background: #eef4e6; padding: 0.12rem 0.45rem; border-radius: 5px;
          font-family: ui-monospace, monospace; font-size: 0.9rem; color: #5e9e2e;
        }
        .tiptap-reader pre { background: #0e1622; color: #f3f4f6; padding: 1rem; border-radius: 10px; overflow-x: auto; }
        .tiptap-reader pre code { background: transparent; padding: 0; color: inherit; }
        .tiptap-reader a { color: #3e8fd0; text-decoration: underline; }
        .tiptap-reader hr { border: 0; border-top: 1px solid rgba(14, 22, 34, 0.08); margin: 2rem 0; }
      `}</style>
    </div>
  )
}
