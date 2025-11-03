import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Check if user has dismissed prompt before
    const dismissed = localStorage.getItem('pwa-prompt-dismissed')
    const dismissedTime = dismissed ? parseInt(dismissed) : 0
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)

    // Show prompt after 30 seconds of usage, but not if dismissed in last 7 days
    if (daysSinceDismissed > 7 || !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 30000) // 30 seconds

      return () => clearTimeout(timer)
    }

    // Listen for install prompt event
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after user engagement (e.g., created an invoice)
      const engagementCheck = setInterval(() => {
        const hasEngaged = localStorage.getItem('user-engaged')
        if (hasEngaged === 'true' && !dismissed) {
          setShowPrompt(true)
          clearInterval(engagementCheck)
        }
      }, 5000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('PWA installed')
      setIsInstalled(true)
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
  }

  // Don't show if already installed
  if (isInstalled || !showPrompt) return null

  // iOS-specific install instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-white rounded-lg shadow-2xl border border-gray-200 p-6 z-50 animate-slide-up">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start space-x-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <Smartphone className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">
              Install HonestInvoice
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Install this app on your iPhone: tap <span className="inline-block align-middle">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                </svg>
              </span> then "Add to Home Screen"
            </p>
            <button
              onClick={handleDismiss}
              className="text-primary hover:text-primary-600 text-sm font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Android/Desktop install prompt
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-white rounded-lg shadow-2xl border border-gray-200 p-6 z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start space-x-4">
        <div className="p-3 bg-primary-100 rounded-lg">
          <Download className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">
            Install HonestInvoice App
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Get quick access from your home screen. Works offline with instant loading!
          </p>
          <div className="flex space-x-3">
            <button
              onClick={handleInstall}
              className="flex-1 bg-primary hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
