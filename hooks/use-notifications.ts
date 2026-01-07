"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AppNotification, NotificationType, NotificationCategory, NotificationAction } from "@/types"
import { generateId } from "@/lib/utils"

interface NotificationStore {
  notifications: AppNotification[]

  // Actions
  addNotification: (notification: Omit<AppNotification, "id" | "isRead" | "createdAt">) => string
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  clearRead: () => void

  // Getters
  getUnreadCount: () => number
  getUnreadNotifications: () => AppNotification[]
  getNotificationsByCategory: (category: NotificationCategory) => AppNotification[]
}

export const useNotifications = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (notification) => {
        const id = generateId()
        const newNotification: AppNotification = {
          ...notification,
          id,
          isRead: false,
          createdAt: new Date(),
        }

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep max 50
        }))

        return id
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }))
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        }))
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
      },

      clearAll: () => {
        set({ notifications: [] })
      },

      clearRead: () => {
        set((state) => ({
          notifications: state.notifications.filter((n) => !n.isRead),
        }))
      },

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.isRead).length
      },

      getUnreadNotifications: () => {
        return get().notifications.filter((n) => !n.isRead)
      },

      getNotificationsByCategory: (category) => {
        return get().notifications.filter((n) => n.category === category)
      },
    }),
    {
      name: "notifications-storage",
      partialize: (state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          // Remove non-serializable action.onClick
          action: n.action ? { label: n.action.label, href: n.action.href } : undefined,
        })),
      }),
    }
  )
)

// Helper function to create notifications with common patterns
export function createNotification(
  type: NotificationType,
  category: NotificationCategory,
  title: string,
  message: string,
  action?: NotificationAction,
  metadata?: Record<string, unknown>
): Omit<AppNotification, "id" | "isRead" | "createdAt"> {
  return {
    type,
    category,
    title,
    message,
    action,
    metadata,
  }
}
