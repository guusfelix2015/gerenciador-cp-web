import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, ChevronDown, X } from "lucide-react";

interface ComboboxOption {
  value: string;
  label: string;
  subLabel?: string;
}

interface ComboboxProps {
  placeholder?: string;
  searchPlaceholder?: string;
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Combobox({
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  options,
  value,
  onChange,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = search
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          (o.subLabel && o.subLabel.toLowerCase().includes(search.toLowerCase()))
      )
    : options;

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          !value && "text-muted-foreground"
        )}
      >
        <span className="truncate">
          {selected ? `${selected.label}${selected.subLabel ? ` (${selected.subLabel})` : ""}` : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg max-h-60 overflow-y-auto">
          <div className="sticky top-0 bg-popover border-b p-2 z-10">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-transparent pl-8 pr-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
          <div className="p-1">
            {filtered.length === 0 ? (
              <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                Nenhum resultado encontrado
              </div>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                    value === option.value && "bg-accent text-accent-foreground font-medium"
                  )}
                >
                  <span className="truncate">
                    {option.label}
                    {option.subLabel && (
                      <span className="text-muted-foreground ml-1">({option.subLabel})</span>
                    )}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
