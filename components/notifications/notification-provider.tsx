"use client"

import { createContext, useContext, useState, useCallback } from "react"
import { NotificationToast, NotificationToastContainer } from "./notification-toast"
import { useNotifications } from "@/hooks/use-notifications"
import type { NotificationType, NotificationCategory, NotificationAction } from "@/types"

interface ToastNotification {
  id: string
  title: string
  message: string
  type: NotificationType
  action?: NotificationAction
}

interface NotificationContextValue {
  showNotification: (
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      category?: NotificationCategory
      action?: NotificationAction
      persist?: boolean
      duration?: number
    }
  ) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function useNotificationToast() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotificationToast must be used within NotificationProvider")
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const { addNotification } = useNotifications()

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showNotification = useCallback(
    (
      type: NotificationType,
      title: string,
      message: string,
      options?: {
        category?: NotificationCategory
        action?: NotificationAction
        persist?: boolean
        duration?: number
      }
    ) => {
      const { category = "general", action, persist = true } = options || {}

      // Add to persistent store if needed
      if (persist) {
        addNotification({
          type,
          category,
          title,
          message,
          action,
        })
      }

      // Show toast
      const toastId = crypto.randomUUID()
      setToasts((prev) => [
        ...prev,
        { id: toastId, title, message, type, action },
      ])
    },
    [addNotification]
  )

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <NotificationToastContainer>
        {toasts.map((toast) => (
          <NotificationToast
            key={toast.id}
            id={toast.id}
            title={toast.title}
            message={toast.message}
            type={toast.type}
            action={toast.action}
            onDismiss={dismissToast}
          />
        ))}
      </NotificationToastContainer>
    </NotificationContext.Provider>
  )
}
