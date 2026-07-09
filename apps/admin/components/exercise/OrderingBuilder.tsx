'use client'

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { OrderingPayload } from '@spiko/shared'

type Props = {
  value: OrderingPayload
  onChange: (v: OrderingPayload) => void
}

function rid() {
  return Math.random().toString(36).slice(2, 9)
}

export function OrderingBuilder({ value, onChange }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function addItem() {
    onChange({ ...value, items: [...value.items, { id: rid(), text: '' }] })
  }
  function removeItem(id: string) {
    onChange({ ...value, items: value.items.filter((i) => i.id !== id) })
  }
  function updateText(id: string, text: string) {
    onChange({
      ...value,
      items: value.items.map((i) => (i.id === id ? { ...i, text } : i)),
    })
  }
  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return
    const oldIdx = value.items.findIndex((i) => i.id === e.active.id)
    const newIdx = value.items.findIndex((i) => i.id === e.over!.id)
    onChange({ ...value, items: arrayMove(value.items, oldIdx, newIdx) })
  }

  return (
    <div className="col" style={{ gap: '1rem' }}>
      <label className="label">
        <span>Pitanje / instrukcija (opciono)</span>
        <input
          className="input"
          value={value.question ?? ''}
          onChange={(e) => onChange({ ...value, question: e.target.value })}
          placeholder='npr. "Poređaj rečenice po vremenskom redosledu"'
        />
      </label>

      <div>
        <div className="row between" style={{ marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Stavke ({value.items.length}) u <strong>tačnom redosledu</strong> — studentu se prikazuju izmešane
          </span>
          <button className="btn ghost" onClick={addItem}>
            + Stavka
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext
            items={value.items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="col" style={{ gap: '0.4rem' }}>
              {value.items.length === 0 && (
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem' }}>
                  Nema stavki. Klikni &quot;+ Stavka&quot; da dodaš prvu.
                </p>
              )}
              {value.items.map((item, idx) => (
                <SortableRow
                  key={item.id}
                  id={item.id}
                  idx={idx}
                  text={item.text}
                  onChange={(t) => updateText(item.id, t)}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}

function SortableRow({
  id,
  idx,
  text,
  onChange,
  onRemove,
}: {
  id: string
  idx: number
  text: string
  onChange: (t: string) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        background: 'var(--panel-2)',
        border: '1px solid var(--border-2)',
        borderRadius: 8,
        padding: '0.5rem 0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
      }}
    >
      <span
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab', color: 'var(--muted)', userSelect: 'none' }}
        title="Prevuci da promeniš redosled"
      >
        ⋮⋮
      </span>
      <span style={{ width: 22, textAlign: 'center', color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem' }}>
        {idx + 1}.
      </span>
      <input
        className="input"
        style={{ flex: 1 }}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Stavka ${idx + 1}`}
      />
      <button
        className="btn ghost"
        onClick={onRemove}
        style={{ color: 'var(--danger)' }}
        title="Obriši stavku"
      >
        ×
      </button>
    </div>
  )
}

export function emptyOrdering(): OrderingPayload {
  return { items: [] }
}
