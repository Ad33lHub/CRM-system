import { useState, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TagInput({
  value = [],
  onChange,
  placeholder = 'Add a tag...',
  maxTags = 10,
  suggestions = [],
  className,
}) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  const addTag = useCallback(
    (tag) => {
      const cleaned = tag.trim().toLowerCase();
      if (!cleaned) return;
      if (value.length >= maxTags) return;
      if (value.some((t) => t.toLowerCase() === cleaned)) return;
      onChange([...value, cleaned]);
      setInput('');
      setShowSuggestions(false);
    },
    [value, onChange, maxTags]
  );

  const removeTag = useCallback(
    (index) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value.length - 1);
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const filteredSuggestions = suggestions
    .filter(
      (s) =>
        s.toLowerCase().includes(input.toLowerCase()) &&
        !value.some((v) => v.toLowerCase() === s.toLowerCase())
    )
    .slice(0, 8);

  return (
    <div className={cn('relative', className)}>
      {/* Decorative wrapper that forwards clicks to the focusable input; keyboard users tab straight to the input. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background transition-colors',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, i) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(i);
              }}
              className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {value.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => input && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[80px] outline-none bg-transparent placeholder:text-muted-foreground"
          />
        )}
      </div>

      {/* Tag counter */}
      <p className="text-xs text-muted-foreground mt-1 text-right">
        {value.length}/{maxTags} tags
      </p>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md max-h-[160px] overflow-y-auto">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(s);
              }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default TagInput;
