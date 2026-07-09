'use client'

import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { useEffect } from 'react'
import { promptDialog } from './dialog'

type Props = {
  value: string // HTML
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Napiši sadržaj lekcije…',
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener', target: '_blank' },
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tiptap-content',
      },
    },
  })

  // Sync value sa editorom kad parent menja
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor])

  if (!editor) return null

  return (
    <div
      style={{
        border: '1px solid var(--border-2)',
        borderRadius: 8,
        background: 'var(--bg)',
      }}
    >
      <Toolbar editor={editor} />
      <div style={{ padding: '0.85rem 1rem' }}>
        <EditorContent editor={editor} />
      </div>
      <style>{`
        .tiptap-content { min-height: 200px; outline: none; font-size: 0.95rem; line-height: 1.6; }
        .tiptap-content h2 { font-size: 1.4rem; font-weight: 700; margin: 1.2rem 0 0.6rem; }
        .tiptap-content h3 { font-size: 1.15rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .tiptap-content p { margin: 0.4rem 0; }
        .tiptap-content ul, .tiptap-content ol { padding-left: 1.5rem; margin: 0.4rem 0; }
        .tiptap-content li { margin: 0.15rem 0; }
        .tiptap-content code { background: var(--panel-2); padding: 0.1rem 0.35rem; border-radius: 4px; font-family: monospace; font-size: 0.85rem; }
        .tiptap-content pre { background: var(--panel-2); padding: 0.7rem; border-radius: 6px; overflow-x: auto; }
        .tiptap-content pre code { background: transparent; padding: 0; }
        .tiptap-content blockquote { border-left: 3px solid var(--accent); padding-left: 0.85rem; color: var(--muted); margin: 0.6rem 0; }
        .tiptap-content a { color: var(--accent-hover); text-decoration: underline; }
        .tiptap-content strong { font-weight: 700; }
        .tiptap-content em { font-style: italic; }
        .tiptap-content .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: var(--muted);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        padding: '0.4rem',
        borderBottom: '1px solid var(--border)',
        background: 'var(--panel-2)',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
      }}
    >
      <Btn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} label="B" weight={700} />
      <Btn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} label="I" italic />
      <Btn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} label="S̶" />
      <Divider />
      <Btn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="H2" />
      <Btn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} label="H3" />
      <Divider />
      <Btn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} label="• Lista" />
      <Btn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="1. Lista" />
      <Divider />
      <Btn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} label="Kod" />
      <Btn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} label="❝ Citat" />
      <Btn
        active={editor.isActive('link')}
        onClick={async () => {
          const existing = editor.getAttributes('link').href ?? ''
          const url = await promptDialog({
            title: existing ? 'Izmeni link' : 'Dodaj link',
            label: 'URL',
            placeholder: 'https://…',
            initialValue: existing || 'https://',
            okLabel: existing ? 'Sačuvaj' : 'Dodaj',
            cancelLabel: existing ? 'Otkaži' : 'Otkaži',
            // Prazna vrednost znači "ukloni link"
            validate: (v) => {
              if (!v) return null
              if (!/^https?:\/\//i.test(v) && !v.startsWith('/')) {
                return 'URL mora počinjati sa http://, https:// ili /'
              }
              return null
            },
          })
          if (url === null) return
          if (url === '') editor.chain().focus().unsetLink().run()
          else editor.chain().focus().setLink({ href: url }).run()
        }}
        label="🔗 Link"
      />
      <Divider />
      <Btn onClick={() => editor.chain().focus().undo().run()} label="↶" disabled={!editor.can().undo()} />
      <Btn onClick={() => editor.chain().focus().redo().run()} label="↷" disabled={!editor.can().redo()} />
    </div>
  )
}

function Divider() {
  return <span style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
}

function Btn({
  active,
  onClick,
  label,
  weight,
  italic,
  disabled,
}: {
  active?: boolean
  onClick: () => void
  label: string
  weight?: number
  italic?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? 'white' : disabled ? 'var(--muted)' : 'var(--fg)',
        border: 0,
        padding: '0.35rem 0.55rem',
        borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '0.8rem',
        fontWeight: weight ?? 500,
        fontStyle: italic ? 'italic' : 'normal',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  )
}
