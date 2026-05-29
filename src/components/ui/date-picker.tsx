import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Popover } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, X } from "lucide-react"

interface DatePickerProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ value, onChange, placeholder = "Selecionar data", className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const date = value ? new Date(value + "T00:00:00") : undefined

  return (
    <Popover open={open} onOpenChange={setOpen} content={
      <Calendar
        mode="single"
        selected={date}
        onSelect={(d) => {
          if (d) {
            const year = d.getFullYear()
            const month = String(d.getMonth() + 1).padStart(2, "0")
            const day = String(d.getDate()).padStart(2, "0")
            onChange(`${year}-${month}-${day}`)
          } else {
            onChange("")
          }
          setOpen(false)
        }}
      />
    }>
      <button
        type="button"
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          !value && "text-muted-foreground",
          className
        )}
      >
        <span className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 opacity-50" />
          {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : placeholder}
        </span>
        {value ? (
          <span
            onClick={(e) => {
              e.stopPropagation()
              onChange("")
            }}
            className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-muted cursor-pointer"
          >
            <X className="h-3 w-3" />
          </span>
        ) : (
          <CalendarIcon className="h-4 w-4 opacity-0" />
        )}
      </button>
    </Popover>
  )
}
