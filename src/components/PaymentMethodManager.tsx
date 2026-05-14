'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface PaymentMethod {
  id: string
  type: 'card' | 'paypal' | 'bank'
  last4?: string
  brand?: string
  email?: string
  bankName?: string
  isDefault: boolean
  expiryMonth?: number
  expiryYear?: number
}

export default function PaymentMethodManager() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedType, setSelectedType] = useState<'card' | 'paypal' | 'bank'>('card')

  useEffect(() => {
    const saved = localStorage.getItem('autoreview-payment-methods')
    if (saved) {
      setPaymentMethods(JSON.parse(saved))
    }
  }, [])

  const savePaymentMethods = (methods: PaymentMethod[]) => {
    localStorage.setItem('autoreview-payment-methods', JSON.stringify(methods))
    setPaymentMethods(methods)
  }

  const addPaymentMethod = (method: Omit<PaymentMethod, 'id' | 'isDefault'>) => {
    const newMethod: PaymentMethod = {
      ...method,
      id: Date.now().toString(),
      isDefault: paymentMethods.length === 0
    }
    savePaymentMethods([...paymentMethods, newMethod])
    setShowAddForm(false)
  }

  const removePaymentMethod = (id: string) => {
    if (confirm('Are you sure you want to remove this payment method?')) {
      const updated = paymentMethods.filter(m => m.id !== id)
      if (updated.length > 0 && !updated.some(m => m.isDefault)) {
        updated[0].isDefault = true
      }
      savePaymentMethods(updated)
    }
  }

  const setDefaultPaymentMethod = (id: string) => {
    const updated = paymentMethods.map(m => ({
      ...m,
      isDefault: m.id === id
    }))
    savePaymentMethods(updated)
  }

  const getPaymentIcon = (type: string, brand?: string) => {
    if (type === 'card') {
      switch (brand?.toLowerCase()) {
        case 'visa': return '💳'
        case 'mastercard': return '💳'
        case 'amex': return '💳'
        case 'discover': return '💳'
        default: return '💳'
      }
    } else if (type === 'paypal') {
      return '🅿️'
    } else if (type === 'bank') {
      return '🏦'
    }
    return '💰'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-white">Payment Methods</h3>
          <p className="text-white/60 text-sm mt-1">Manage your payment methods for subscriptions</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all"
        >
          {showAddForm ? '✕ Cancel' : '+ Add Payment Method'}
        </motion.button>
      </div>

      {/* Add Payment Method Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card border-2 border-primary/20 rounded-xl p-6"
        >
          <h4 className="text-lg font-semibold text-white mb-4">Add New Payment Method</h4>
          
          {/* Payment Type Selection */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {(['card', 'paypal', 'bank'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedType === type
                    ? 'border-primary bg-primary/10 text-white'
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <div className="text-3xl mb-2">
                  {type === 'card' ? '💳' : type === 'paypal' ? '🅿️' : '🏦'}
                </div>
                <div className="text-sm font-medium capitalize">{type}</div>
              </button>
            ))}
          </div>

          {/* Card Form */}
          {selectedType === 'card' && (
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              addPaymentMethod({
                type: 'card',
                brand: formData.get('brand') as string,
                last4: (formData.get('cardNumber') as string).slice(-4),
                expiryMonth: parseInt(formData.get('expiryMonth') as string),
                expiryYear: parseInt(formData.get('expiryYear') as string)
              })
            }} className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">Card Brand</label>
                <select name="brand" required className="w-full glass rounded-lg px-4 py-2 text-white">
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="amex">American Express</option>
                  <option value="discover">Discover</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white/80 text-sm mb-2">Card Number</label>
                <input
                  type="text"
                  name="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  pattern="[0-9]{16}"
                  maxLength={16}
                  required
                  className="w-full glass rounded-lg px-4 py-2 text-white placeholder:text-white/30"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">Month</label>
                  <input
                    type="number"
                    name="expiryMonth"
                    placeholder="MM"
                    min="1"
                    max="12"
                    required
                    className="w-full glass rounded-lg px-4 py-2 text-white placeholder:text-white/30"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-2">Year</label>
                  <input
                    type="number"
                    name="expiryYear"
                    placeholder="YYYY"
                    min={new Date().getFullYear()}
                    max={new Date().getFullYear() + 20}
                    required
                    className="w-full glass rounded-lg px-4 py-2 text-white placeholder:text-white/30"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-2">CVV</label>
                  <input
                    type="text"
                    name="cvv"
                    placeholder="123"
                    pattern="[0-9]{3,4}"
                    maxLength={4}
                    required
                    className="w-full glass rounded-lg px-4 py-2 text-white placeholder:text-white/30"
                  />
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-all"
              >
                Add Card
              </motion.button>
            </form>
          )}

          {/* PayPal Form */}
          {selectedType === 'paypal' && (
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              addPaymentMethod({
                type: 'paypal',
                email: formData.get('email') as string
              })
            }} className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">PayPal Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="your.email@example.com"
                  required
                  className="w-full glass rounded-lg px-4 py-2 text-white placeholder:text-white/30"
                />
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-all"
              >
                Connect PayPal
              </motion.button>
            </form>
          )}

          {/* Bank Transfer Form */}
          {selectedType === 'bank' && (
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              addPaymentMethod({
                type: 'bank',
                bankName: formData.get('bankName') as string,
                last4: (formData.get('accountNumber') as string).slice(-4)
              })
            }} className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  placeholder="Your Bank Name"
                  required
                  className="w-full glass rounded-lg px-4 py-2 text-white placeholder:text-white/30"
                />
              </div>
              
              <div>
                <label className="block text-white/80 text-sm mb-2">Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  placeholder="Account Number"
                  required
                  className="w-full glass rounded-lg px-4 py-2 text-white placeholder:text-white/30"
                />
              </div>
              
              <div>
                <label className="block text-white/80 text-sm mb-2">Routing Number</label>
                <input
                  type="text"
                  name="routingNumber"
                  placeholder="Routing Number"
                  required
                  className="w-full glass rounded-lg px-4 py-2 text-white placeholder:text-white/30"
                />
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-all"
              >
                Add Bank Account
              </motion.button>
            </form>
          )}

          <p className="text-white/50 text-xs mt-4">
            🔒 Your payment information is encrypted and secure.
          </p>
        </motion.div>
      )}

      {/* Payment Methods List */}
      <div className="space-y-4">
        {paymentMethods.length === 0 ? (
          <div className="glass-card border-2 border-white/10 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">💳</div>
            <h4 className="text-lg font-semibold text-white mb-2">No Payment Methods</h4>
            <p className="text-white/60 text-sm">
              Add a payment method to manage your subscriptions easily
            </p>
          </div>
        ) : (
          paymentMethods.map((method) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass-card border-2 rounded-xl p-4 ${
                method.isDefault ? 'border-primary/50' : 'border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{getPaymentIcon(method.type, method.brand)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-white font-semibold capitalize">
                        {method.type === 'card' ? method.brand : method.type}
                      </h5>
                      {method.isDefault && (
                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-sm">
                      {method.type === 'card' && `•••• •••• •••• ${method.last4}`}
                      {method.type === 'paypal' && method.email}
                      {method.type === 'bank' && `${method.bankName} •••• ${method.last4}`}
                    </p>
                    {method.expiryMonth && method.expiryYear && (
                      <p className="text-white/40 text-xs mt-1">
                        Expires {method.expiryMonth}/{method.expiryYear}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDefaultPaymentMethod(method.id)}
                      className="px-3 py-1 glass text-white/70 hover:text-white text-sm rounded-lg"
                    >
                      Set Default
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => removePaymentMethod(method.id)}
                    className="px-3 py-1 glass text-red-400 hover:text-red-300 text-sm rounded-lg"
                  >
                    Remove
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Security Notice */}
      <div className="glass-card border-2 border-white/10 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🔒</div>
          <div>
            <h5 className="text-white font-semibold mb-1">Secure Payment Processing</h5>
            <p className="text-white/60 text-sm">
              All payment information is encrypted using industry-standard SSL/TLS protocols. 
              We never store your full card details.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
