import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PROPERTY_TYPES } from '../data/propertyTypes';

type PropertyTypeSelectProps = {
  value: string;
  onChange: (value: string) => void;
};

export function PropertyTypeSelect({ value, onChange }: PropertyTypeSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const select = (option: string) => {
    onChange(option);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-4 rounded-2xl border border-gray-200 bg-white text-left text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || 'Select Property Type'}
        </span>
        <ChevronDown
          size={20}
          className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
          {PROPERTY_TYPES.map((group) => (
            <div key={group.category}>
              <div className="px-4 py-2.5 text-xs font-bold text-gray-700 bg-blue-50 sticky top-0">
                {group.category}
              </div>
              {group.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => select(option)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    value === option
                      ? 'bg-blue-100 text-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
