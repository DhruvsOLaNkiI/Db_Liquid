import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

type FormSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  className?: string;
  id?: string;
  'aria-label'?: string;
};

/** In-page select — stays anchored to the field when the page scrolls (unlike native OS pickers). */
export function FormSelect({
  value,
  onChange,
  options,
  placeholder = 'Select',
  className = '',
  id,
  'aria-label': ariaLabel,
}: FormSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const autoId = useId();
  const triggerId = id ?? autoId;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current || !value) return;
    const selected = listRef.current.querySelector<HTMLElement>(
      `[data-value="${CSS.escape(value)}"]`,
    );
    selected?.scrollIntoView({ block: 'nearest' });
  }, [open, value]);

  function choose(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${open ? 'z-50' : 'z-0'}`}>
      <button
        type="button"
        id={triggerId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        className={`form-select-trigger ${className} flex items-center justify-between gap-2 text-left`}
      >
        <span className={`truncate ${value ? '' : 'text-gray-400'}`}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          data-form-select-menu
          className="absolute z-50 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl"
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected={value === ''}
              data-value=""
              onClick={() => choose('')}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                value === ''
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {placeholder}
            </button>
          </li>
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                role="option"
                aria-selected={value === option}
                data-value={option}
                onClick={() => choose(option)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  value === option
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
