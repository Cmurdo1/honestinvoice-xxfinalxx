import { useState } from 'react'
import { 
  Elements,
  PaymentElement,
  useStripe,
  useElements 
} from '@stripe/react-stripe-js'
import { getStripe } from '../lib/stripe'
import { supabase } from '../lib/supabase'
import { CreditCard, Loader2 } from 'lucide-react'

interface StripePaymentFormProps {
  invoiceId: string
  amount: number
  currencyCode: string
  onSuccess: () => void
  onCancel: () => void
}

function PaymentForm({ invoiceId, amount, currencyCode, onSuccess, onCancel }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      // Confirm the payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: window.location.href,
        },
      })

      if (error) {
        setErrorMessage(error.message || 'Payment failed. Please try again.')
        setIsProcessing(false)
        return
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Update payment in database
        const { error: confirmError } = await supabase.functions.invoke('process-payment', {
          body: {
            action: 'confirm_payment',
            invoice_id: invoiceId,
            amount: amount,
            currency_code: currencyCode,
            payment_intent_id: paymentIntent.id,
            payment_method: 'stripe'
          }
        })

        if (confirmError) {
          console.error('Payment confirmation error:', confirmError)
          setErrorMessage('Payment successful but failed to update invoice. Please contact support.')
          setIsProcessing(false)
          return
        }

        // Success!
        onSuccess()
      }
    } catch (err) {
      console.error('Payment error:', err)
      setErrorMessage('An unexpected error occurred. Please try again.')
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Amount to pay:</span>
          <span className="text-lg font-bold text-primary-600">
            {currencyCode.toUpperCase()} ${amount.toFixed(2)}
          </span>
        </div>
      </div>

      <PaymentElement />

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-accent-600 text-white px-4 py-2 rounded-lg hover:bg-accent-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Pay ${amount.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default function StripePaymentForm(props: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create payment intent on mount
  useState(() => {
    const createPaymentIntent = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('process-payment', {
          body: {
            action: 'create_intent',
            invoice_id: props.invoiceId,
            amount: props.amount,
            currency_code: props.currencyCode
          }
        })

        if (error) throw error

        if (data?.data?.clientSecret) {
          setClientSecret(data.data.clientSecret)
        } else {
          throw new Error('No client secret received')
        }
      } catch (err) {
        console.error('Payment intent creation error:', err)
        setError('Failed to initialize payment. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    createPaymentIntent()
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !clientSecret) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="font-medium mb-1">Payment Error</p>
        <p className="text-sm">{error || 'Failed to initialize payment'}</p>
        <button
          onClick={props.onCancel}
          className="mt-3 text-sm text-red-800 hover:text-red-900 underline"
        >
          Go back
        </button>
      </div>
    )
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#2563EB',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  }

  return (
    <Elements stripe={getStripe()} options={options}>
      <PaymentForm {...props} />
    </Elements>
  )
}
