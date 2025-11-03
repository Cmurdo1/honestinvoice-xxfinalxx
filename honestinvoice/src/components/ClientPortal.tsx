import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import StripePaymentForm from './StripePaymentForm'
import { toast } from 'sonner'
import { 
  FileText, 
  Download, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Search,
  Eye,
  Calendar,
  DollarSign,
  X
} from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  issue_date: string
  due_date: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  status: string
  terms_and_conditions: string
  customer_id: string
}

interface TransparencyScore {
  id: string
  invoice_id: string
  overall_score: number
  itemization_score: number
  description_quality_score: number
  terms_clarity_score: number
  recommendation: string
  created_at: string
}

export default function ClientPortal() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'verify'>('dashboard')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [transparencyScores, setTransparencyScores] = useState<Record<string, TransparencyScore>>({})
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [verificationNumber, setVerificationNumber] = useState('')
  const [verifiedInvoice, setVerifiedInvoice] = useState<Invoice | null>(null)
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadUserAndInvoices()
  }, [])

  const loadUserAndInvoices = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (!user) {
        setLoading(false)
        return
      }

      // Find customer record for this user
      const { data: customerData } = await supabase
        .from('customers')
        .select('id, email')
        .eq('email', user.email)
        .single()

      if (!customerData) {
        setLoading(false)
        return
      }

      // Load invoices for this customer
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', customerData.id)
        .order('issue_date', { ascending: false })

      if (invoiceData) {
        setInvoices(invoiceData)
        
        // Load transparency scores for all invoices
        const invoiceIds = invoiceData.map(inv => inv.id)
        const { data: scoreData } = await supabase
          .from('transparency_scores')
          .select('*')
          .in('invoice_id', invoiceIds)

        if (scoreData) {
          const scoreMap: Record<string, TransparencyScore> = {}
          scoreData.forEach(score => {
            scoreMap[score.invoice_id] = score
          })
          setTransparencyScores(scoreMap)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const verifyInvoice = async () => {
    if (!verificationNumber.trim()) return

    setVerificationLoading(true)
    try {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('invoice_number', verificationNumber.trim())
        .single()

      if (data) {
        setVerifiedInvoice(data)
        
        // Load transparency score
        const { data: scoreData } = await supabase
          .from('transparency_scores')
          .select('*')
          .eq('invoice_id', data.id)
          .single()

        if (scoreData) {
          setTransparencyScores(prev => ({
            ...prev,
            [data.id]: scoreData
          }))
        }
      } else {
        toast.error('Invoice not found. Please check the invoice number.')
      }
    } catch (error) {
      console.error('Verification error:', error)
      toast.error('Invoice not found or verification failed.')
    } finally {
      setVerificationLoading(false)
    }
  }

  const downloadInvoice = (invoice: Invoice) => {
    // In production, this would generate and download a PDF
    const invoiceText = `
INVOICE: ${invoice.invoice_number}
Issue Date: ${invoice.issue_date}
Due Date: ${invoice.due_date}

Subtotal: $${invoice.subtotal.toFixed(2)}
Tax: $${invoice.tax_amount.toFixed(2)}
Discount: $${invoice.discount_amount.toFixed(2)}
Total: $${invoice.total_amount.toFixed(2)}

Status: ${invoice.status.toUpperCase()}

Terms: ${invoice.terms_and_conditions}
    `.trim()

    const blob = new Blob([invoiceText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${invoice.invoice_number}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-accent-600 bg-accent-50'
      case 'pending': return 'text-yellow-600 bg-yellow-50'
      case 'overdue': return 'text-red-600 bg-red-50'
      case 'draft': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-accent-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const renderTransparencyBadge = (invoiceId: string) => {
    const score = transparencyScores[invoiceId]
    if (!score) return null

    return (
      <div className="flex items-center gap-2">
        <Shield className={`h-4 w-4 ${getScoreColor(score.overall_score)}`} />
        <span className={`text-sm font-semibold ${getScoreColor(score.overall_score)}`}>
          {score.overall_score}% Transparency
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading client portal...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Client Portal</h2>
        <p className="mt-1 text-sm text-gray-600">
          {user ? 'View your invoices, make payments, and verify invoice authenticity' : 'Verify invoice authenticity'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {user && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                My Invoices
              </div>
            </button>
          )}
          <button
            onClick={() => setActiveTab('verify')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'verify'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Verify Invoice
            </div>
          </button>
        </nav>
      </div>

      {/* Dashboard Tab - Invoice List */}
      {activeTab === 'dashboard' && user && (
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
              <p className="mt-1 text-sm text-gray-500">No invoices found for your account.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {invoice.invoice_number}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status.toUpperCase()}
                        </span>
                      </div>
                      
                      {renderTransparencyBadge(invoice.id)}
                      
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Issued: {new Date(invoice.issue_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                        <span className="text-2xl font-bold text-gray-900">
                          ${invoice.total_amount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => downloadInvoice(invoice)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                      {invoice.status !== 'paid' && (
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                        >
                          <CreditCard className="h-4 w-4" />
                          Pay Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dashboard Tab - No User */}
      {activeTab === 'dashboard' && !user && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Authentication Required</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please log in to view your invoices.
          </p>
        </div>
      )}

      {/* Verify Tab */}
      {activeTab === 'verify' && (
        <div className="space-y-6">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-primary-900">Public Invoice Verification</h3>
                <p className="mt-1 text-sm text-primary-700">
                  Verify the authenticity of any invoice by entering the invoice number below. 
                  Our transparency scoring system ensures trust and accountability.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Number
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={verificationNumber}
                onChange={(e) => setVerificationNumber(e.target.value)}
                placeholder="e.g., INV-2024-001"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                onKeyPress={(e) => e.key === 'Enter' && verifyInvoice()}
              />
              <button
                onClick={verifyInvoice}
                disabled={verificationLoading}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                {verificationLoading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>

          {/* Verified Invoice Display */}
          {verifiedInvoice && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-8 w-8 text-accent-600" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Invoice Verified</h3>
                  <p className="text-sm text-gray-600">This invoice is authentic and registered in our system</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Invoice Number:</span>
                    <p className="text-base font-semibold text-gray-900">{verifiedInvoice.invoice_number}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Status:</span>
                    <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(verifiedInvoice.status)}`}>
                      {verifiedInvoice.status.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Issue Date:</span>
                    <p className="text-base font-semibold text-gray-900">
                      {new Date(verifiedInvoice.issue_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Due Date:</span>
                    <p className="text-base font-semibold text-gray-900">
                      {new Date(verifiedInvoice.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Total Amount:</span>
                    <p className="text-2xl font-bold text-gray-900">
                      ${verifiedInvoice.total_amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Transparency Score Display */}
                {transparencyScores[verifiedInvoice.id] && (
                  <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary-600" />
                      Transparency Score
                    </h4>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${getScoreColor(transparencyScores[verifiedInvoice.id].overall_score)}`}>
                          {transparencyScores[verifiedInvoice.id].overall_score}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Overall</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${getScoreColor(transparencyScores[verifiedInvoice.id].itemization_score)}`}>
                          {transparencyScores[verifiedInvoice.id].itemization_score}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Itemization</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${getScoreColor(transparencyScores[verifiedInvoice.id].description_quality_score)}`}>
                          {transparencyScores[verifiedInvoice.id].description_quality_score}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Description</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${getScoreColor(transparencyScores[verifiedInvoice.id].terms_clarity_score)}`}>
                          {transparencyScores[verifiedInvoice.id].terms_clarity_score}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Terms</div>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-gray-700 italic">
                      "{transparencyScores[verifiedInvoice.id].recommendation}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal with Stripe Integration */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Secure Payment</h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-sm text-gray-600">Invoice Number</span>
                    <p className="text-base font-semibold text-gray-900">{selectedInvoice.invoice_number}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedInvoice.status)}`}>
                    {selectedInvoice.status.toUpperCase()}
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-sm text-gray-600">Due Date</span>
                    <p className="text-base font-medium text-gray-900">
                      {new Date(selectedInvoice.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Total Amount</span>
                    <p className="text-2xl font-bold text-gray-900">
                      ${selectedInvoice.total_amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Payments are securely processed by Stripe</span>
              </div>
            </div>

            <StripePaymentForm
              invoiceId={selectedInvoice.id}
              amount={selectedInvoice.total_amount}
              currencyCode="usd"
              onSuccess={() => {
                setSelectedInvoice(null)
                loadUserAndInvoices()
                toast.success('Payment successful! Your invoice has been updated.')
              }}
              onCancel={() => setSelectedInvoice(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
