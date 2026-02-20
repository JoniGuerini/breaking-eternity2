import { useEffect } from "react"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast, Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ theme = "dark", ...props }: ToasterProps) => {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      console.log("Context menu target:", target)
      // Find the closest toast element
      const toastElement = target.closest('[data-sonner-toast]') as HTMLElement
      console.log("Found toast element:", toastElement)

      if (toastElement) {
        e.preventDefault()
        // The id is usually in data-id or data-sonner-toast if it has a value,
        // but sonner might not expose a clean ID attribute on the DOM element for public consumption easily.
        // Strategy: Try data-id first, then className fallback
        let id = toastElement.getAttribute("data-id")

        if (!id) {
          // Fallback: Check for custom class injection "toast-{id}"
          const classes = toastElement.className.split(" ")
          const toastClass = classes.find(c => c.startsWith("toast-"))
          if (toastClass) {
            id = toastClass.replace("toast-", "")
          }
        }

        if (id) {
          toast.dismiss(id)
        }
      }
    }

    document.addEventListener("contextmenu", handleContextMenu)
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu)
    }
  }, [])

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
