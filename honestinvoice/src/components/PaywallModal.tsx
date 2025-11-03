import { X, Crown, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  feature: string
  requiredPlan: 'pro' | 'business'
  description?: string
}

export default function PaywallModal({ 
  isOpen, 
  onClose, 
  feature, 
  requiredPlan,
  description 
}: PaywallModalProps) {
  const navigate = useNavigate()

  if (!isOpen) return null

  const planNames = {
    pro: 'Pro',
    business: 'Business'
  }

  const planPrices = {
    pro: 19,
    business: 49
  }

  const handleUpgrade = () => {
    onClose()
    navigate('/pricing')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full m-4 overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-primary-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Premium Feature</h3>
          </div>
          <p className="text-primary-100">
            Upgrade to unlock this feature
          </p>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">{feature}</h4>
            <p className="text-gray-600 text-sm">
              {description || `This feature requires a ${planNames[requiredPlan]} plan or higher.`}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-primary" />
                <span className="font-semibold text-gray-900">{planNames[requiredPlan]} Plan</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                ${planPrices[requiredPlan]}
                <span className="text-sm text-gray-600 font-normal">/mo</span>
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {requiredPlan === 'pro' 
                ? 'Unlimited invoices, advanced analytics, custom branding, and more'
                : 'Everything in Pro plus team management, advanced reporting, and priority support'}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
            >
              Upgrade to {planNames[requiredPlan]}
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
