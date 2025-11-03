import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { FileText, Eye, Download, Shield, TrendingUp } from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
  status: string
  issue_date: string
  due_date: string
  grand_total: string
  balance_due: string
  created_at: string
}

interface InvoiceListProps {
  limit?: number
}

export default function InvoiceList({ limit }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<any[]>([])
  const [transparencyScores, setTransparencyScores] = useState<any[]>([])

  useEffect(() => {
    loadInvoices()
  }, [limit])

  const loadInvoices = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data: invoicesData, error: invoicesError } = await query

      if (invoicesError) throw invoicesError

      if (invoicesData) {
        setInvoices(invoicesData)

        // Get all customer IDs
        const customerIds = [...new Set(invoicesData.map(inv => inv.customer_id))]
        
        // Load customers
        if (customerIds.length > 0) {
          const { data: customersData } = await supabase
            .from('customers')
            .select('id, name, email')
            .in('id', customerIds)

          if (customersData) {
            setCustomers(customersData)
          }
        }

        // Load transparency scores
        const invoiceIds = invoicesData.map(inv => inv.id)
        if (invoiceIds.length > 0) {
          const { data: scoresData } = await supabase
            .from('transparency_scores')
            .select('invoice_id, score')
            .in('invoice_id', invoiceIds)

          if (scoresData) {
            setTransparencyScores(scoresData)
          }
        }
      }
    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    return customer?.name || 'Unknown Customer'
  }

  const getTransparencyScore = (invoiceId: string) => {
    const score = transparencyScores.find(s => s.invoice_id === invoiceId)
    return score?.score || 0
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'partial_paid':
        return 'bg-yellow-100 text-yellow-800'
      case 'sent':
      case 'viewed':
        return 'bg-blue-100 text-blue-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'disputed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">No invoices yet</p>
        <p className="text-sm text-gray-500">Create your first invoice to get started</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Invoice</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Transparency</th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => {
            const score = getTransparencyScore(invoice.id)
            return (
              <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-900">{invoice.invoice_number}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-gray-700">
                  {getCustomerName(invoice.customer_id)}
                </td>
                <td className="py-4 px-4 text-gray-600 text-sm">
                  {new Date(invoice.issue_date).toLocaleDateString()}
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="font-semibold text-gray-900">
                    ${Number(invoice.grand_total).toLocaleString()}
                  </div>
                  {Number(invoice.balance_due) > 0 && (
                    <div className="text-sm text-gray-600">
                      Due: ${Number(invoice.balance_due).toLocaleString()}
                    </div>
                  )}
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Shield className={`w-4 h-4 ${getScoreColor(score)}`} />
                    <span className={`font-semibold ${getScoreColor(score)}`}>
                      {score}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {invoice.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <button className="p-2 hover:bg-gray-100 rounded-md" title="View">
                      <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-md" title="Download">
                      <Download className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
