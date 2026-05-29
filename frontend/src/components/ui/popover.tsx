import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverProps {
  children: React.ReactNode
  content: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Popover({ children, content, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const triggerRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        contentRef.current &&
        !contentRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClick)
    }
    return () => document.removeEventListener("mousedown", handleClick)
  }, [isOpen, setOpen])

  return (
    <div className="relative inline-block w-full">
      <div ref={triggerRef} onClick={() => setOpen(!isOpen)} className="w-full">
        {children}
      </div>
      {isOpen && (
        <div
          ref={contentRef}
          className="absolute z-50 mt-1 w-auto rounded-md border bg-popover text-popover-foreground shadow-md p-2"
        >
          {content}
        </div>
      )}
    </div>
  )
}
