'use client'
import { useState, useEffect } from 'react'
import { CreditCard, Shield, Clock, CheckCircle, AlertTriangle, Wallet } from 'lucide-react'
import analytics from '../../lib/analytics'
import costGuard from '../../lib/cost-guard'

interface BookingData {
  serviceType: string
  vendorId: string
  amount: number
  date: string
  location: string
  participants: number
}

interface PaymentMethod {
  type: 'stripe' | 'paypal' | 'demo'
  available: boolean
  processingFee: number
}

interface BookingFlowProps {
  bookingData: BookingData
  onComplete: (result: any) => void
  onCancel: () => void
}

const COST_BREAKDOWN = {
  postgresWrite: 0.00008,
  redisCache: 0.00002, 
  stripeApi: 0.00006,
  emailTrigger: 0.00002,
  total: 0.00018
}

const DEMO_CARDS = {
  visa: '4242424242424242',
  visaDebit: '4000056655665556',
  mastercard: '5555555555554444',
  amex: '378282246310005',
  declined: '4000000000000002'
}

export default function BookingFlow({ bookingData, onComplete, onCancel }: BookingFlowProps) {
  const [currentStep, setCurrentStep] = useState<'review' | 'payment' | 'processing' | 'confirmation'>('review')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPayment, setSelectedPayment] = useState<'stripe' | 'paypal' | 'demo'>('stripe')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [costValidation, setCostValidation] = useState<any>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(false)

  // Card form state
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  })

  useEffect(() => {
    initializePaymentMethods()
    validateTransactionCost()
  }, [])

  const initializePaymentMethods = async () => {
    // Check which payment methods are available
    const methods: PaymentMethod[] = [
      {
        type: 'stripe',
        available: true, // In production, check Stripe availability
        processingFee: 0.029 // 2.9% + 30¢
      },
      {
        type: 'paypal',
        available: true, // Fallback option
        processingFee: 0.031 // 3.1% + 30¢  
      },
      {
        type: 'demo',
        available: process.env.NODE_ENV === 'development',
        processingFee: 0
      }
    ]

    setPaymentMethods(methods)
    
    // Set demo mode if in development
    if (process.env.NODE_ENV === 'development') {
      setDemoMode(true)
      setSelectedPayment('demo')
    }

    await analytics.logEvent('BOOKING_FLOW_INITIALIZED', {
      serviceType: bookingData.serviceType,
      amount: bookingData.amount,
      availableMethods: methods.filter(m => m.available).map(m => m.type)
    })
  }

  const validateTransactionCost = async () => {
    // Hurricane v4.1 cost validation
    const costCheck = await costGuard.checkCost(COST_BREAKDOWN.total, 'booking_transaction')
    setCostValidation(costCheck)

    if (!costCheck.allowed) {
      setError(`Transaction blocked: ${costCheck.reason}`)
      await analytics.logEvent('BOOKING_COST_BLOCKED', {
        amount: bookingData.amount,
        transactionCost: COST_BREAKDOWN.total,
        reason: costCheck.reason
      })
    }
  }

  const processPayment = async () => {
    if (!costValidation?.allowed) {
      setError('Transaction cost validation failed')
      return
    }

    setLoading(true)
    setError(null)
    setCurrentStep('processing')

    try {
      // Generate booking ID
      const newBookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setBookingId(newBookingId)

      // Log booking initiation
      await analytics.logEvent('BOOKING_INITIATED', {
        bookingId: newBookingId,
        amount: bookingData.amount,
        paymentMethod: selectedPayment,
        transactionCost: costValidation.adjustedCost || COST_BREAKDOWN.total
      })

      let paymentResult
      
      switch (selectedPayment) {
        case 'stripe':
          paymentResult = await processStripePayment(newBookingId)
          break
        case 'paypal':
          paymentResult = await processPayPalPayment(newBookingId)
          break
        case 'demo':
          paymentResult = await processDemoPayment(newBookingId)
          break
        default:
          throw new Error('Invalid payment method')
      }

      if (paymentResult.success) {
        // Update booking status
        await updateBookingStatus(newBookingId, 'confirmed', paymentResult)
        setCurrentStep('confirmation')
        
        await analytics.logEvent('BOOKING_COMPLETED', {
          bookingId: newBookingId,
          amount: bookingData.amount,
          paymentMethod: selectedPayment,
          actualCost: costValidation.adjustedCost || COST_BREAKDOWN.total,
          processingTime: paymentResult.processingTime
        })

        onComplete({
          bookingId: newBookingId,
          paymentResult,
          bookingData
        })
      } else {
        throw new Error(paymentResult.error || 'Payment failed')
      }

    } catch (error: any) {
      console.error('Payment processing error:', error)
      setError(error.message)
      
      await analytics.logEvent('BOOKING_FAILED', {
        bookingId: bookingId || 'unknown',
        error: error.message,
        paymentMethod: selectedPayment
      })

      // Progressive enhancement: Offer PayPal if Stripe fails
      if (selectedPayment === 'stripe' && paymentMethods.find(m => m.type === 'paypal')?.available) {
        setSelectedPayment('paypal')
        setError('Stripe payment failed. Trying PayPal as backup...')
        setTimeout(() => setError(null), 3000)
      }
      
      setCurrentStep('payment')
    } finally {
      setLoading(false)
    }
  }

  const processStripePayment = async (bookingId: string): Promise<any> => {
    const startTime = Date.now()
    
    // Simulate Stripe payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // In production, this would integrate with Stripe Elements
    const success = !cardData.number.includes('0002') // Demo decline logic
    
    if (success) {
      return {
        success: true,
        transactionId: `stripe_${Date.now()}`,
        processingTime: Date.now() - startTime,
        method: 'stripe',
        fee: bookingData.amount * paymentMethods.find(m => m.type === 'stripe')!.processingFee
      }
    } else {
      throw new Error('Card declined')
    }
  }

  const processPayPalPayment = async (bookingId: string): Promise<any> => {
    const startTime = Date.now()
    
    // Simulate PayPal payment processing
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    return {
      success: true,
      transactionId: `paypal_${Date.now()}`,
      processingTime: Date.now() - startTime,
      method: 'paypal',
      fee: bookingData.amount * paymentMethods.find(m => m.type === 'paypal')!.processingFee
    }
  }

  const processDemoPayment = async (bookingId: string): Promise<any> => {
    const startTime = Date.now()
    
    // Demo mode processing
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const success = cardData.number !== DEMO_CARDS.declined
    
    if (success) {
      return {
        success: true,
        transactionId: `demo_${Date.now()}`,
        processingTime: Date.now() - startTime,
        method: 'demo',
        fee: 0
      }
    } else {
      throw new Error('Demo card declined (as expected)')
    }
  }

  const updateBookingStatus = async (bookingId: string, status: string, paymentResult: any) => {
    // Simulate database update (PostgreSQL write - $0.00008)
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Simulate Redis cache update ($0.00002)  
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Simulate email trigger ($0.00002)
    await new Promise(resolve => setTimeout(resolve, 150))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (currentStep === 'review') {
    return (
      <div className="max-w-lg mx-auto bg-gradient-to-br from-chocolate/80 to-vegas-dust/60 backdrop-blur-lg rounded-2xl p-6 border border-vegas-gold/30">
        <h2 className="text-2xl font-bold text-vegas-gold mb-6 flex items-center gap-2">
          <CheckCircle className="w-6 h-6" />
          Booking Review
        </h2>
        
        <div className="space-y-4 text-desert-sand">
          <div className="flex justify-between">
            <span>Service:</span>
            <span className="text-vegas-gold">{bookingData.serviceType}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{new Date(bookingData.date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Location:</span>
            <span>{bookingData.location}</span>
          </div>
          <div className="flex justify-between">
            <span>Participants:</span>
            <span>{bookingData.participants}</span>
          </div>
          <div className="border-t border-vegas-gold/30 pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount:</span>
              <span className="text-vegas-gold">{formatCurrency(bookingData.amount)}</span>
            </div>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="mt-6 p-4 bg-vegas-gold/10 rounded-lg">
          <h3 className="text-sm font-bold text-vegas-gold mb-2">Hurricane v4.1 Cost Validation</h3>
          <div className="text-xs text-desert-sand space-y-1">
            <div className="flex justify-between">
              <span>PostgreSQL write:</span>
              <span>${COST_BREAKDOWN.postgresWrite.toFixed(5)}</span>
            </div>
            <div className="flex justify-between">
              <span>Redis cache:</span>
              <span>${COST_BREAKDOWN.redisCache.toFixed(5)}</span>
            </div>
            <div className="flex justify-between">
              <span>Stripe API:</span>
              <span>${COST_BREAKDOWN.stripeApi.toFixed(5)}</span>
            </div>
            <div className="flex justify-between">
              <span>Email trigger:</span>
              <span>${COST_BREAKDOWN.emailTrigger.toFixed(5)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-vegas-gold/30 pt-1">
              <span>Total cost:</span>
              <span className={COST_BREAKDOWN.total <= 0.0002 ? 'text-green-400' : 'text-red-400'}>
                ${COST_BREAKDOWN.total.toFixed(5)} ✓
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-desert-sand/20 text-desert-sand rounded-lg hover:bg-desert-sand/30 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => setCurrentStep('payment')}
            className="flex-1 py-3 px-4 bg-vegas-gold text-chocolate rounded-lg hover:bg-vegas-gold/90 transition-colors font-bold"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    )
  }

  if (currentStep === 'payment') {
    return (
      <div className="max-w-lg mx-auto bg-gradient-to-br from-chocolate/80 to-vegas-dust/60 backdrop-blur-lg rounded-2xl p-6 border border-vegas-gold/30">
        <h2 className="text-2xl font-bold text-vegas-gold mb-6 flex items-center gap-2">
          <CreditCard className="w-6 h-6" />
          Payment Details
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-400/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {costValidation?.degraded && (
          <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-400/50 rounded-lg text-yellow-200 text-sm">
            ⚠️ Hurricane v4.1 degraded mode active - transaction protected
          </div>
        )}

        {/* Payment method selection */}
        <div className="mb-6">
          <label className="block text-desert-sand text-sm font-medium mb-3">Payment Method</label>
          <div className="space-y-2">
            {paymentMethods.filter(m => m.available).map(method => (
              <button
                key={method.type}
                onClick={() => setSelectedPayment(method.type)}
                className={`w-full p-3 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                  selectedPayment === method.type 
                    ? 'border-vegas-gold bg-vegas-gold/10 text-vegas-gold'
                    : 'border-desert-sand/30 bg-chocolate/50 text-desert-sand hover:border-vegas-gold/50'
                }`}
              >
                {method.type === 'stripe' && <CreditCard className="w-5 h-5" />}
                {method.type === 'paypal' && <Wallet className="w-5 h-5" />}
                {method.type === 'demo' && <Shield className="w-5 h-5" />}
                <span className="capitalize">{method.type === 'demo' ? 'Demo Mode' : method.type}</span>
                {method.processingFee > 0 && (
                  <span className="ml-auto text-sm">
                    {(method.processingFee * 100).toFixed(1)}% fee
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Card form */}
        {(selectedPayment === 'stripe' || selectedPayment === 'demo') && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-desert-sand text-sm font-medium mb-2">Card Number</label>
              <input
                type="text"
                value={cardData.number}
                onChange={(e) => setCardData({...cardData, number: e.target.value})}
                placeholder={demoMode ? DEMO_CARDS.visa : "1234 5678 9012 3456"}
                className="w-full p-3 bg-chocolate/50 border border-vegas-gold/30 rounded-lg text-desert-sand focus:border-vegas-gold focus:outline-none"
                maxLength={19}
              />
              {demoMode && (
                <div className="mt-2 text-xs text-desert-sand/70">
                  <p>Demo cards: Visa ({DEMO_CARDS.visa}), Declined ({DEMO_CARDS.declined})</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-desert-sand text-sm font-medium mb-2">Expiry</label>
                <input
                  type="text"
                  value={cardData.expiry}
                  onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                  placeholder="12/25"
                  className="w-full p-3 bg-chocolate/50 border border-vegas-gold/30 rounded-lg text-desert-sand focus:border-vegas-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-desert-sand text-sm font-medium mb-2">CVC</label>
                <input
                  type="text"
                  value={cardData.cvc}
                  onChange={(e) => setCardData({...cardData, cvc: e.target.value})}
                  placeholder="123"
                  className="w-full p-3 bg-chocolate/50 border border-vegas-gold/30 rounded-lg text-desert-sand focus:border-vegas-gold focus:outline-none"
                  maxLength={4}
                />
              </div>
            </div>

            <div>
              <label className="block text-desert-sand text-sm font-medium mb-2">Cardholder Name</label>
              <input
                type="text"
                value={cardData.name}
                onChange={(e) => setCardData({...cardData, name: e.target.value})}
                placeholder="John Doe"
                className="w-full p-3 bg-chocolate/50 border border-vegas-gold/30 rounded-lg text-desert-sand focus:border-vegas-gold focus:outline-none"
              />
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button 
            onClick={() => setCurrentStep('review')}
            className="flex-1 py-3 px-4 bg-desert-sand/20 text-desert-sand rounded-lg hover:bg-desert-sand/30 transition-colors"
          >
            Back
          </button>
          <button 
            onClick={processPayment}
            disabled={loading || !costValidation?.allowed}
            className="flex-1 py-3 px-4 bg-vegas-gold text-chocolate rounded-lg hover:bg-vegas-gold/90 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : `Pay ${formatCurrency(bookingData.amount)}`}
          </button>
        </div>
      </div>
    )
  }

  if (currentStep === 'processing') {
    return (
      <div className="max-w-lg mx-auto bg-gradient-to-br from-chocolate/80 to-vegas-dust/60 backdrop-blur-lg rounded-2xl p-6 border border-vegas-gold/30 text-center">
        <Clock className="w-16 h-16 text-vegas-gold mx-auto mb-4 animate-spin" />
        <h2 className="text-2xl font-bold text-vegas-gold mb-4">Processing Payment</h2>
        <p className="text-desert-sand mb-6">Please wait while we securely process your payment...</p>
        <div className="flex justify-center gap-2">
          <div className="w-3 h-3 bg-vegas-gold rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-vegas-gold rounded-full animate-bounce delay-100"></div>
          <div className="w-3 h-3 bg-vegas-gold rounded-full animate-bounce delay-200"></div>
        </div>
        <p className="text-xs text-desert-sand/60 mt-4">
          Hurricane v4.1 protected • Cost: ${(costValidation?.adjustedCost || COST_BREAKDOWN.total).toFixed(5)}
        </p>
      </div>
    )
  }

  if (currentStep === 'confirmation') {
    return (
      <div className="max-w-lg mx-auto bg-gradient-to-br from-chocolate/80 to-vegas-dust/60 backdrop-blur-lg rounded-2xl p-6 border border-vegas-gold/30 text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-vegas-gold mb-4">Booking Confirmed!</h2>
        <p className="text-desert-sand mb-6">
          Your booking has been successfully processed and confirmed.
        </p>
        
        <div className="bg-vegas-gold/10 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-bold text-vegas-gold mb-2">Booking Details</h3>
          <div className="text-sm text-desert-sand space-y-1">
            <p>Booking ID: <span className="text-vegas-gold">{bookingId}</span></p>
            <p>Service: {bookingData.serviceType}</p>
            <p>Amount: {formatCurrency(bookingData.amount)}</p>
            <p>Payment: {selectedPayment.toUpperCase()}</p>
          </div>
        </div>

        <div className="text-xs text-desert-sand/60 mb-6">
          🎰 Vegas Sovereign AI • Hurricane v4.1 Protected 🎰
        </div>

        <button 
          onClick={() => onComplete({ bookingId, bookingData })}
          className="w-full py-3 px-4 bg-vegas-gold text-chocolate rounded-lg hover:bg-vegas-gold/90 transition-colors font-bold"
        >
          Continue
        </button>
      </div>
    )
  }

  return null
}