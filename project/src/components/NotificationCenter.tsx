import { useEffect } from 'react'
import { useNotificationStore, type NotificationEntry } from '@/store/notificationStore'

const AUTO_DISMISS_MS = 6000

const variantStyles: Record<NotificationEntry['variant'], string> = {
  info: 'border-slate-600/60 bg-slate-900/90 text-slate-100',
  error: 'border-rose-500/70 bg-rose-500/10 text-rose-100'
}

const NotificationItem = ({ notification }: { notification: NotificationEntry }) => {
  const removeNotification = useNotificationStore(state => state.removeNotification)

  useEffect(() => {
    const timeout = window.setTimeout(() => removeNotification(notification.id), AUTO_DISMISS_MS)
    return () => window.clearTimeout(timeout)
  }, [notification.id, removeNotification])

  return (
    <div
      role='status'
      className={[
        'pointer-events-auto w-80 rounded-lg border px-4 py-3 shadow-lg shadow-slate-950/60 backdrop-blur',
        'transition-all duration-200 ease-out',
        variantStyles[notification.variant]
      ].join(' ')}
    >
      <p className='text-sm font-medium'>{notification.message}</p>
      {notification.description && (
        <p className='mt-1 text-xs text-slate-400'>{notification.description}</p>
      )}
      <button
        type='button'
        onClick={() => removeNotification(notification.id)}
        className='mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400 transition hover:text-slate-200'
      >
        Kapat
      </button>
    </div>
  )
}

const NotificationCenter = () => {
  const notifications = useNotificationStore(state => state.notifications)

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className='pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:justify-end sm:px-6'>
      <div className='flex flex-col gap-3'>
        {notifications.map(notification => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>
    </div>
  )
}

export default NotificationCenter
