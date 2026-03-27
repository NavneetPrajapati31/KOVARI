"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          "--normal-bg": "rgba(249, 250, 251, 0.75)",
          "--normal-border": "rgba(0, 0, 0, 0.08)",
          "--normal-text": "#1c1c1e",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:backdrop-blur-xl group-[.toaster]:border group-[.toaster]:shadow-sm group-[.toaster]:rounded-2xl group-[.toast]:gap-6 font-sans",
          title: "group-[.toast]:text-foreground group-[.toast]:font-semibold group-[.toast]:text-[15px] group-[.toast]:pl-2",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-[14px] group-[.toast]:pl-2",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          icon: "group-data-[type=error]:text-destructive group-data-[type=success]:text-primary group-data-[type=warning]:text-orange-500 group-data-[type=info]:text-blue-500 [&_svg]:size-6 ml-2 mr-2",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

