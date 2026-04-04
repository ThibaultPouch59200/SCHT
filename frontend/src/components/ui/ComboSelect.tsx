import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';

interface ComboSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  onCreateNew?: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export const ComboSelect: React.FC<ComboSelectProps> = ({
  options,
  value,
  onChange,
  onCreateNew,
  placeholder,
  style,
}) => {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase())
  );

  const exactMatch = options.some(
    (o) => o.toLowerCase() === query.trim().toLowerCase()
  );

  const canCreate = !!onCreateNew && query.trim().length > 0 && !exactMatch;

  const select = (opt: string) => {
    onChange(opt);
    setQuery(opt);
    setOpen(false);
  };

  const handleCreate = () => {
    if (canCreate && onCreateNew) {
      onCreateNew(query.trim());
      onChange(query.trim());
      setOpen(false);
    }
  };

  const showDropdown = open && (filtered.length > 0 || canCreate);

  return (
    <div ref={wrapRef} className="combo-wrap" style={style}>
      <input
        type="text"
        className="combo-input"
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        style={{ width: '100%' }}
      />
      {showDropdown && (
        <div className="combo-dropdown">
          {filtered.map((opt) => (
            <div
              key={opt}
              className="combo-option"
              onMouseDown={() => select(opt)}
            >
              {opt}
            </div>
          ))}
          {canCreate && (
            <div className="combo-option combo-create" onMouseDown={handleCreate}>
              <Plus size={10} style={{ marginRight: 5, flexShrink: 0 }} />
              Créer &laquo;&nbsp;{query.trim()}&nbsp;&raquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
};
