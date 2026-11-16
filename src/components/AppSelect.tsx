import { useEffect, useId, useRef, useState } from 'react'

export interface AppSelectOption<T extends string | number> {
  value: T
  label: string
}

interface AppSelectProps<T extends string | number> {
  id?: string
  'aria-label'?: string
  value: T
  options: AppSelectOption<T>[]
  onChange: (value: T) => void
  className?: string
  disabled?: boolean
}

export function AppSelect<T extends string | number>({
  id,
  'aria-label': ariaLabel,
  value,
  options,
  onChange,
  className,
  disabled = false,
}: AppSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div
      ref={rootRef}
      className={['app-select', open ? 'is-open' : undefined, className].filter(Boolean).join(' ')}
    >
      <button
        type="button"
        id={id}
        className="app-select-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="app-select-value">{selected?.label ?? 'Choose…'}</span>
        <span className="app-select-chevron" aria-hidden />
      </button>
      {open ? (
        <ul id={listId} className="app-select-menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <li key={String(option.value)} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`app-select-option ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}