import { useEffect, useId, useMemo, useRef, useState } from "react";
import "./SearchSelect.css";

export type SearchSelectOption = {
  id: string;
  label: string;
  supportingText?: string;
  badgeText?: string;
};

type AddRow = {
  label: string;
};

type SearchSelectProps = {
  label: string;
  placeholder: string;
  value: string;
  disabled?: boolean;
  loading?: boolean;
  options: SearchSelectOption[];
  addRow?: AddRow | null;
  noResultsText?: string;
  onValueChange: (nextValue: string) => void;
  onSelectOption: (optionId: string) => void;
  onSelectAddRow?: () => void;
  keepOpenOnSelect?: boolean;
};

type Row =
  | { type: "option"; key: string; option: SearchSelectOption }
  | { type: "add"; key: string; add: AddRow };

export default function SearchSelect({
  label,
  placeholder,
  value,
  disabled = false,
  loading = false,
  options,
  addRow = null,
  noResultsText = "No tags found.",
  onValueChange,
  onSelectOption,
  onSelectAddRow,
  keepOpenOnSelect = false,
}: SearchSelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const rows = useMemo<Row[]>(() => {
    const baseRows = options.map<Row>((option) => ({
      type: "option",
      key: option.id,
      option,
    }));
    if (!addRow) return baseRows;
    return [...baseRows, { type: "add", key: "__add__", add: addRow }];
  }, [addRow, options]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || rows.length === 0) {
      setHighlightedIndex(-1);
      return;
    }
    setHighlightedIndex(0);
  }, [isOpen, rows]);

  function selectRow(row: Row) {
    if (row.type === "option") {
      onSelectOption(row.option.id);
    } else {
      onSelectAddRow?.();
    }
    if (!keepOpenOnSelect) {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setIsOpen(true);
      event.preventDefault();
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    if (!isOpen || rows.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % rows.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? rows.length - 1 : prev - 1));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const row = rows[highlightedIndex];
      if (row) selectRow(row);
    }
  }

  const activeId =
    highlightedIndex >= 0 && highlightedIndex < rows.length
      ? `${listboxId}-option-${highlightedIndex}`
      : undefined;

  return (
    <div
      ref={rootRef}
      className={`search-select${isOpen && !disabled ? " is-open" : ""}`}
    >
      <label className="exp-form-field">
        <span>{label}</span>
        <input
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            onValueChange(event.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
      </label>

      {isOpen && !disabled && (
        <div className="search-select-dropdown">
          {loading ? (
            <p className="search-select-empty">Loading tags...</p>
          ) : rows.length === 0 ? (
            <p className="search-select-empty">{noResultsText}</p>
          ) : (
            <ul id={listboxId} role="listbox" className="search-select-list">
              {rows.map((row, index) => {
                const highlighted = index === highlightedIndex;
                const id = `${listboxId}-option-${index}`;
                if (row.type === "add") {
                  return (
                    <li id={id} key={row.key} role="option" aria-selected={highlighted}>
                      <button
                        type="button"
                        className={`search-select-chip search-select-chip-add ${
                          highlighted ? "is-highlighted" : ""
                        }`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectRow(row)}
                      >
                        <span className="search-select-chip-text">{row.add.label}</span>
                        <span className="search-select-chip-action" aria-hidden="true">
                          +
                        </span>
                      </button>
                    </li>
                  );
                }

                return (
                  <li id={id} key={row.key} role="option" aria-selected={highlighted}>
                    <button
                      type="button"
                      className={`search-select-chip ${highlighted ? "is-highlighted" : ""}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectRow(row)}
                    >
                      <span className="search-select-chip-text-block">
                        <span className="search-select-main">{row.option.label}</span>
                        {row.option.supportingText ? (
                          <span className="search-select-supporting">
                            {row.option.supportingText}
                          </span>
                        ) : null}
                        {row.option.badgeText ? (
                          <span className="search-select-badge">{row.option.badgeText}</span>
                        ) : null}
                      </span>
                      <span className="search-select-chip-action" aria-hidden="true">
                        +
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
