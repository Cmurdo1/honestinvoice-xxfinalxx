import { loadStripe, Stripe } from '@stripe/stripe-js'

// Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51SNSvcAtFazn277ouGyBWt7nCbcPe421Gru13gnTgVOByAfQSEKAFYzERToQkovP8WGiW8jwdlE77MCNsuAi5GcG00qD69X4JF'

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}
