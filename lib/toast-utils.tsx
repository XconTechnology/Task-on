import { toast } from "@/hooks/use-toast"
import { CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { ReactNode } from "react"

type ToastType = "success" | "error" | "warning" | "info"

interface ShowToastOptions {
  title?: string
  description?: string
  duration?: number
}

export const showToast = (type: ToastType, options: ShowToastOptions) => {
  const { title = "", description = "", duration = 5000 } = options

  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <AlertCircle className="h-5 w-5 text-red-600" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
  }

  return toast({
    variant: type as any,
    title, // must be a string
    description: (
      <div className="flex items-center gap-2">
        {icons[type]}
        <span>{description}</span>
      </div>
    ),
    duration,
  })
}

export const successToast = (options: ShowToastOptions) => showToast("success", options)
export const errorToast = (options: ShowToastOptions) => showToast("error", options)
export const warningToast = (options: ShowToastOptions) => showToast("warning", options)
export const infoToast = (options: ShowToastOptions) => showToast("info", options)
