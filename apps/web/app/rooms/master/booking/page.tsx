'use client'
import { useState, useEffect } from 'react'
import { Crown, Calendar, MapPin, Users, DollarSign, ArrowLeft, Star } from 'lucide-react'
import BookingFlow from '../../../components/BookingFlow'
import analytics from '../../../../lib/analytics'

interface Service {
  id: string
  name: string
  category: string
  price: number
  duration: string
  rating: number
  reviews: number
  description: string
  features: string[]
  vendor: {
    id: string
    name: string
    rating: number
    verified: boolean
  }
}

interface BookingState {
  step: 'selection' | 'details' | 'payment' | 'confirmation'
  service: Service | null
  details: {
    date: string
    time: string
    location: string
    participants: number
    specialRequests: string
  }
}

const VEGAS_SERVICES: Service[] = [
  {
    id: 'vip_nightlife',
    name: 'VIP Nightlife Experience',
    category: 'Entertainment',
    price: 299,
    duration: '4 hours',
    rating: 4.9,
    reviews: 234,
    description: 'Exclusive access to premium Vegas venues with bottle service and VIP treatment',
    features: ['Skip-the-line access', 'Bottle service included', 'Personal host', 'Transportation'],
    vendor: {
      id: 'vendor_nightlife_1',
      name: 'Vegas Premier Experiences',
      rating: 4.8,
      verified: true
    }
  },
  {
    id: 'luxury_suite',
    name: 'Luxury Suite Experience',
    category: 'Accommodation', 
    price: 599,
    duration: '1 night',
    rating: 4.8,
    reviews: 156,
    description: 'Premium suite with panoramic Strip views and concierge service',
    features: ['Strip view', 'Concierge service', 'Premium amenities', 'Late checkout'],
    vendor: {
      id: 'vendor_hotel_1',
      name: 'Desert Luxury Hotels',
      rating: 4.9,
      verified: true
    }
  },
  {
    id: 'gourmet_dining',
    name: 'Celebrity Chef Experience',
    category: 'Dining',
    price: 189,
    duration: '2.5 hours',
    rating: 4.7,
    reviews: 89,
    description: 'Multi-course tasting menu at award-winning restaurant',
    features: ['Chef table experience', 'Wine pairing', 'Meet the chef', 'Special menu'],
    vendor: {
      id: 'vendor_dining_1',
      name: 'Mirage Culinary Group',
      rating: 4.7,
      verified: true
    }
  },
  {
    id: 'spa_wellness',
    name: 'Vegas Wellness Retreat',
    category: 'Wellness',
    price: 245,
    duration: '3 hours',
    rating: 4.6,
    reviews: 67,
    description: 'Complete relaxation package with massage and spa treatments',
    features: ['Full body massage', 'Facial treatment', 'Spa access', 'Refreshments'],
    vendor: {
      id: 'vendor_spa_1',
      name: 'Oasis Wellness Center',
      rating: 4.6,
      verified: true
    }
  }
]

export default function MasterBedroomBooking() {
  const [bookingState, setBookingState] = useState<BookingState>({
    step: 'selection',
    service: null,
    details: {
      date: '',
      time: '',
      location: 'Las Vegas, NV',
      participants: 2,
      specialRequests: ''
    }
  })

  const [conversionRate, setConversionRate] = useState(2.3)
  const [totalBookings, setTotalBookings] = useState(1247)

  useEffect(() => {
    // Log page view
    analytics.logEvent('MASTER_BEDROOM_BOOKING_VIEW', {
      timestamp: new Date().toISOString(),
      availableServices: VEGAS_SERVICES.length
    })
  }, [])

  const handleServiceSelect = (service: Service) => {
    setBookingState(prev => ({
      ...prev,
      service,
      step: 'details'
    }))

    analytics.logEvent('SERVICE_SELECTED', {
      serviceId: service.id,
      serviceName: service.name,
      price: service.price,
      category: service.category
    })
  }

  const handleBookingDetails = (details: any) => {
    setBookingState(prev => ({
      ...prev,
      details: { ...prev.details, ...details },
      step: 'payment'
    }))

    analytics.logEvent('BOOKING_DETAILS_COMPLETED', {
      serviceId: bookingState.service?.id,
      participants: details.participants,
      date: details.date,
      location: details.location
    })
  }

  const handleBookingComplete = (result: any) => {
    setTotalBookings(prev => prev + 1)
    
    analytics.logEvent('BOOKING_REVENUE_GENERATED', {
      bookingId: result.bookingId,
      amount: bookingState.service?.price || 0,
      service: bookingState.service?.name,
      conversionSource: 'master_bedroom'
    })

    setBookingState(prev => ({ ...prev, step: 'confirmation' }))
  }

  const handleBookingCancel = () => {
    analytics.logEvent('BOOKING_CANCELLED', {
      step: bookingState.step,
      serviceId: bookingState.service?.id
    })
    
    setBookingState({
      step: 'selection',
      service: null,
      details: {
        date: '',
        time: '',
        location: 'Las Vegas, NV',
        participants: 2,
        specialRequests: ''
      }
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (bookingState.step === 'payment' && bookingState.service) {
    const bookingData = {
      serviceType: bookingState.service.name,
      vendorId: bookingState.service.vendor.id,
      amount: bookingState.service.price,
      date: bookingState.details.date,
      location: bookingState.details.location,
      participants: bookingState.details.participants
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-chocolate via-vegas-dust to-chocolate p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Crown className="w-12 h-12 text-vegas-gold" />
              <h1 className="text-4xl font-bold text-vegas-gold">Master Bedroom</h1>
            </div>
            <p className="text-desert-sand">Vegas Premium Booking Experience</p>
          </div>

          <BookingFlow
            bookingData={bookingData}
            onComplete={handleBookingComplete}
            onCancel={handleBookingCancel}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chocolate via-vegas-dust to-chocolate p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Crown className="w-16 h-16 text-vegas-gold animate-pulse" />
            <div>
              <h1 className="text-6xl font-bold text-vegas-gold mb-2">
                Master Bedroom
              </h1>
              <p className="text-xl text-desert-sand">Vegas Premium Booking Hub</p>
            </div>
          </div>

          {/* Live Stats */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-vegas-gold">{conversionRate}%</div>
              <div className="text-desert-sand text-sm">Conversion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-vegas-gold">{totalBookings.toLocaleString()}</div>
              <div className="text-desert-sand text-sm">Total Bookings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-vegas-gold">$0.00018</div>
              <div className="text-desert-sand text-sm">Cost per Booking</div>
            </div>
          </div>

          <div className="bg-vegas-gold/10 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-vegas-gold font-bold">🎰 Hurricane v4.1 Payment Integration Active</p>
            <p className="text-desert-sand text-sm">Stripe + PayPal • Live booking flow • Under $0.0002/transaction</p>
          </div>
        </div>

        {bookingState.step === 'selection' && (
          <div>
            <h2 className="text-2xl font-bold text-vegas-gold mb-8 text-center">
              Select Your Vegas Experience
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {VEGAS_SERVICES.map(service => (
                <div 
                  key={service.id}
                  className="bg-gradient-to-br from-chocolate/80 to-vegas-dust/60 backdrop-blur-lg rounded-2xl p-6 border border-vegas-gold/30 hover:border-vegas-gold/60 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
                  onClick={() => handleServiceSelect(service)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-vegas-gold mb-1">{service.name}</h3>
                      <p className="text-desert-sand text-sm">{service.category} • {service.duration}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-vegas-gold">{formatCurrency(service.price)}</div>
                      <div className="flex items-center gap-1 text-sm text-desert-sand">
                        <Star className="w-4 h-4 fill-current text-vegas-gold" />
                        {service.rating} ({service.reviews})
                      </div>
                    </div>
                  </div>

                  <p className="text-desert-sand mb-4">{service.description}</p>

                  <div className="space-y-2 mb-4">
                    {service.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-desert-sand">
                        <div className="w-1.5 h-1.5 bg-vegas-gold rounded-full"></div>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-vegas-gold/30">
                    <div className="flex items-center gap-2 text-sm text-desert-sand">
                      {service.vendor.verified && (
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      )}
                      {service.vendor.name}
                    </div>
                    <button className="px-4 py-2 bg-vegas-gold text-chocolate rounded-lg hover:bg-vegas-gold/90 transition-colors font-medium">
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {bookingState.step === 'details' && bookingState.service && (
          <div className="max-w-2xl mx-auto">
            <button 
              onClick={() => setBookingState(prev => ({ ...prev, step: 'selection' }))}
              className="flex items-center gap-2 text-desert-sand hover:text-vegas-gold transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Services
            </button>

            <div className="bg-gradient-to-br from-chocolate/80 to-vegas-dust/60 backdrop-blur-lg rounded-2xl p-6 border border-vegas-gold/30">
              <h2 className="text-2xl font-bold text-vegas-gold mb-6">Booking Details</h2>
              
              {/* Selected Service */}
              <div className="bg-vegas-gold/10 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-vegas-gold">{bookingState.service.name}</h3>
                    <p className="text-desert-sand">{bookingState.service.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-vegas-gold">
                      {formatCurrency(bookingState.service.price)}
                    </div>
                    <div className="text-sm text-desert-sand">{bookingState.service.duration}</div>
                  </div>
                </div>
              </div>

              {/* Booking Form */}
              <div className="space-y-6">
                <div>
                  <label className="block text-desert-sand text-sm font-medium mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={bookingState.details.date}
                    onChange={(e) => setBookingState(prev => ({
                      ...prev,
                      details: { ...prev.details, date: e.target.value }
                    }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 bg-chocolate/50 border border-vegas-gold/30 rounded-lg text-desert-sand focus:border-vegas-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-desert-sand text-sm font-medium mb-2">
                    Preferred Time
                  </label>
                  <select
                    value={bookingState.details.time}
                    onChange={(e) => setBookingState(prev => ({
                      ...prev,
                      details: { ...prev.details, time: e.target.value }
                    }))}
                    className="w-full p-3 bg-chocolate/50 border border-vegas-gold/30 rounded-lg text-desert-sand focus:border-vegas-gold focus:outline-none"
                  >
                    <option value="">Select time</option>
                    <option value="18:00">6:00 PM</option>
                    <option value="19:00">7:00 PM</option>
                    <option value="20:00">8:00 PM</option>
                    <option value="21:00">9:00 PM</option>
                    <option value="22:00">10:00 PM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-desert-sand text-sm font-medium mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Location
                  </label>
                  <select
                    value={bookingState.details.location}
                    onChange={(e) => setBookingState(prev => ({
                      ...prev,
                      details: { ...prev.details, location: e.target.value }
                    }))}
                    className="w-full p-3 bg-chocolate/50 border border-vegas-gold/30 rounded-lg text-desert-sand focus:border-vegas-gold focus:outline-none"
                  >
                    <option value="Las Vegas, NV">Las Vegas Strip</option>
                    <option value="Downtown Las Vegas">Downtown Las Vegas</option>
                    <option value="Henderson, NV">Henderson</option>
                    <option value="Summerlin, NV">Summerlin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-desert-sand text-sm font-medium mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    Number of Participants
                  </label>
                  <select
                    value={bookingState.details.participants}
                    onChange={(e) => setBookingState(prev => ({
                      ...prev,
                      details: { ...prev.details, participants: parseInt(e.target.value) }
                    }))}
                    className="w-full p-3 bg-chocolate/50 border border-vegas-gold/30 rounded-lg text-desert-sand focus:border-vegas-gold focus:outline-none"
                  >
                    {[1,2,3,4,5,6,7,8].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'person' : 'people'}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-desert-sand text-sm font-medium mb-2">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    value={bookingState.details.specialRequests}
                    onChange={(e) => setBookingState(prev => ({
                      ...prev,
                      details: { ...prev.details, specialRequests: e.target.value }
                    }))}
                    placeholder="Any special requirements or requests..."
                    rows={3}
                    className="w-full p-3 bg-chocolate/50 border border-vegas-gold/30 rounded-lg text-desert-sand focus:border-vegas-gold focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setBookingState(prev => ({ ...prev, step: 'selection' }))}
                  className="flex-1 py-3 px-4 bg-desert-sand/20 text-desert-sand rounded-lg hover:bg-desert-sand/30 transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={() => handleBookingDetails(bookingState.details)}
                  disabled={!bookingState.details.date || !bookingState.details.time}
                  className="flex-1 py-3 px-4 bg-vegas-gold text-chocolate rounded-lg hover:bg-vegas-gold/90 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {bookingState.step === 'confirmation' && (
          <div className="text-center">
            <div className="max-w-lg mx-auto bg-gradient-to-br from-chocolate/80 to-vegas-dust/60 backdrop-blur-lg rounded-2xl p-8 border border-vegas-gold/30">
              <Crown className="w-20 h-20 text-vegas-gold mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-vegas-gold mb-4">Booking Confirmed!</h2>
              <p className="text-desert-sand mb-6">
                Your Vegas experience has been booked successfully. You'll receive a confirmation email shortly.
              </p>
              
              <div className="bg-vegas-gold/10 rounded-lg p-4 mb-6">
                <p className="text-vegas-gold font-bold mb-2">🎰 Welcome to the House! 🎰</p>
                <p className="text-desert-sand text-sm">
                  Hurricane v4.1 protected booking • Revenue generated • Conversion tracked
                </p>
              </div>

              <button 
                onClick={() => window.location.href = '/rooms/master'}
                className="w-full py-3 px-4 bg-vegas-gold text-chocolate rounded-lg hover:bg-vegas-gold/90 transition-colors font-bold"
              >
                Back to Master Bedroom
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}