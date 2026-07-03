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
    <div ref={containerRef} className="relative z-50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-4 rounded-2xl border border-white/10 bg-white/5 text-left text-lg focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/20 focus:border-[#FF7A00] transition-colors"
      >
        <span className={value ? 'text-white' : 'text-gray-500'}>
          {value || 'Select Property Type'}
        </span>
        <ChevronDown
          size={20}
          className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-[100] top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-2xl max-h-72 overflow-y-auto">
          {PROPERTY_TYPES.map((group) => (
            <div key={group.category}>
              <div className="px-4 py-2.5 text-sm font-semibold text-white bg-black/40 border-b border-white/10 sticky top-0 backdrop-blur-md">
                {group.category}
              </div>
              {group.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => select(option)}
                  className={`w-full text-left px-4 py-2.5 text-sm border-b border-white/5 last:border-b-0 transition-colors ${
                    value === option
                      ? 'bg-[#FF7A00]/20 text-white font-medium'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
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
