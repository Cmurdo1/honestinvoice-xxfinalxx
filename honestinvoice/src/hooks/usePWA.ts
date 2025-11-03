import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function usePWA() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered:', registration)

            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    toast.info('New version available! Refresh to update.', {
                      duration: 10000,
                      action: {
                        label: 'Refresh',
                        onClick: () => window.location.reload()
                      }
                    })
                  }
                })
              }
            })
          })
          .catch((error) => {
            console.error('SW registration failed:', error)
          })
      })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_INVOICES') {
          // Trigger invoice sync in the app
          console.log('Syncing invoices from service worker message')
        }
      })
    }

    // Track user engagement for install prompt
    const trackEngagement = () => {
      localStorage.setItem('user-engaged', 'true')
    }

    // Track after user creates invoice or performs key action
    const invoiceForm = document.querySelector('[data-invoice-form]')
    if (invoiceForm) {
      invoiceForm.addEventListener('submit', trackEngagement)
    }

    // Handle app shortcuts
    const urlParams = new URLSearchParams(window.location.search)
    const action = urlParams.get('action')
    const view = urlParams.get('view')

    if (action === 'create') {
      // Trigger create invoice modal
      setTimeout(() => {
        const createButton = document.querySelector('[data-create-invoice]') as HTMLElement
        createButton?.click()
      }, 500)
    }

    if (view) {
      // Navigate to specific view
      localStorage.setItem('pwa-initial-view', view)
    }

    return () => {
      if (invoiceForm) {
        invoiceForm.removeEventListener('submit', trackEngagement)
      }
    }
  }, [])
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// Request notification permission
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// Subscribe to push notifications
export async function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription()
    if (existingSubscription) {
      return existingSubscription
    }

    // Subscribe to push notifications
    // Note: In production, you would need a VAPID public key
    // const subscription = await registration.pushManager.subscribe({
    //   userVisibleOnly: true,
    //   applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY'
    // })

    // For now, just return null since we don't have a push server set up
    return null
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error)
    return null
  }
}
