import { nanoid } from 'nanoid'
import { create } from 'zustand'

type NotificationVariant = 'info' | 'error'

export interface NotificationEntry {
  id: string
  message: string
  description?: string
  variant: NotificationVariant
  createdAt: number
}

export interface AddNotificationOptions {
  description?: string
  variant?: NotificationVariant
}

interface NotificationState {
  notifications: NotificationEntry[]
  addNotification: (message: string, options?: AddNotificationOptions) => string
  removeNotification: (id: string) => void
}

export const useNotificationStore = create<NotificationState>(set => ({
  notifications: [],
  addNotification: (message, options) => {
    const entry: NotificationEntry = {
      id: nanoid(),
      message,
      description: options?.description,
      variant: options?.variant ?? 'info',
      createdAt: Date.now()
    }

    set(state => ({ notifications: [...state.notifications, entry] }))
    return entry.id
  },
  removeNotification: id =>
    set(state => ({ notifications: state.notifications.filter(notification => notification.id !== id) }))
}))
