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
import { useEffect, useState } from 'react'

type Item = { id: string; text: string }
type Data = {
  question?: string
  items: Item[]
}

type Result = {
  details: unknown
}

export function OrderingPlayer({
  payload,
  onAnswers,
  locked,
  result,
}: {
  payload: Data
  onAnswers: (a: unknown) => void
  locked: boolean
  result: Result | null
}) {
  const [items, setItems] = useState<Item[]>(payload.items)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    onAnswers({ orderIds: items.map((i) => i.id) })
  }, [items, onAnswers])

  const expectedOrder =
    (result?.details as { expectedOrder?: string[] } | undefined)?.expectedOrder ?? []

  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return
    const oldIdx = items.findIndex((i) => i.id === e.active.id)
    const newIdx = items.findIndex((i) => i.id === e.over!.id)
    setItems(arrayMove(items, oldIdx, newIdx))
  }

  return (
    <div>
      {payload.question && (
        <p className="font-display text-lg font-bold text-ink">{payload.question}</p>
      )}
      <p className="mt-2 text-sm text-muted">Prevuci stavke u tačan redosled.</p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="mt-5 flex flex-col gap-2">
            {items.map((item, idx) => {
              const isCorrectPos = locked && expectedOrder[idx] === item.id
              const isWrongPos = locked && expectedOrder[idx] !== item.id
              return (
                <Row
                  key={item.id}
                  id={item.id}
                  text={item.text}
                  idx={idx}
                  locked={locked}
                  isCorrect={isCorrectPos}
                  isWrong={isWrongPos}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function Row({
  id,
  text,
  idx,
  locked,
  isCorrect,
  isWrong,
}: {
  id: string
  text: string
  idx: number
  locked: boolean
  isCorrect: boolean
  isWrong: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: locked,
  })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={`flex items-center gap-3 rounded-xl border-2 p-4 ${
        isCorrect
          ? 'border-primary bg-primary/5'
          : isWrong
            ? 'border-red-300 bg-red-50'
            : 'border-ink/10 bg-white'
      } ${locked ? 'cursor-default' : 'cursor-grab'}`}
      {...(!locked ? attributes : {})}
      {...(!locked ? listeners : {})}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/5 font-bold text-ink">
        {idx + 1}
      </span>
      <span className="flex-1 text-ink/85">{text}</span>
      {!locked && <span className="text-muted">⋮⋮</span>}
      {isCorrect && <span className="text-primary-dark font-bold">✓</span>}
      {isWrong && <span className="text-red-500 font-bold">✗</span>}
    </div>
  )
}
