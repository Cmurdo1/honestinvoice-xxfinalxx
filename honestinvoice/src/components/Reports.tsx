// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  FileText,
  Users,
  PieChart,
  BarChart3,
  Filter
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ReportData {
  revenue: {
    total: number
    byMonth: Array<{ month: string; amount: number }>
    byStatus: Array<{ status: string; count: number; amount: number }>
  }
  customers: {
    total: number
    new: number
    active: number
  }
  invoices: {
    total: number
    paid: number
    pending: number
    overdue: number
    avgAmount: number
  }
  payments: {
    total: number
    totalAmount: number
    byMethod: Array<{ method: string; count: number; amount: number }>
  }
  transparency: {
    avgScore: number
    distribution: Array<{ range: string; count: number }>
  }
}

export default function Reports() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d')
  const [selectedReport, setSelectedReport] = useState<'overview' | 'revenue' | 'customers' | 'invoices' | 'payments'>('overview')

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  useEffect(() => {
    loadReportData()
  }, [dateRange])

  const getDateFilter = () => {
    const now = new Date()
    switch (dateRange) {
      case '7d':
        return new Date(now.setDate(now.getDate() - 7)).toISOString()
      case '30d':
        return new Date(now.setDate(now.getDate() - 30)).toISOString()
      case '90d':
        return new Date(now.setDate(now.getDate() - 90)).toISOString()
      case '1y':
        return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString()
      default:
        return null
    }
  }

  const loadReportData = async () => {
    try {
      setLoading(true)
      const dateFilter = getDateFilter()

      // Load invoices
      let invoiceQuery = supabase.from('invoices').select('*')
      if (dateFilter) {
        invoiceQuery = invoiceQuery.gte('issue_date', dateFilter)
      }
      const { data: invoices } = await invoiceQuery

      // Load payments
      let paymentQuery = supabase.from('payments').select('*')
      if (dateFilter) {
        paymentQuery = paymentQuery.gte('payment_date', dateFilter)
      }
      const { data: payments } = await paymentQuery

      // Load customers
      let customerQuery = supabase.from('customers').select('*')
      if (dateFilter) {
        customerQuery = customerQuery.gte('created_at', dateFilter)
      }
      const { data: customers } = await customerQuery

      // Load transparency scores
      const { data: scores } = await supabase
        .from('transparency_scores')
        .select('overall_score, invoice_id')

      // Process data
      if (invoices) {
        // Revenue by month
        const monthlyRevenue: Record<string, number> = {}
        invoices.forEach(inv => {
          const month = new Date(inv.issue_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(inv.total_amount)
        })

        const revenueByMonth = Object.entries(monthlyRevenue).map(([month, amount]) => ({
          month,
          amount
        }))

        // Revenue by status
        const statusGroups = invoices.reduce((acc, inv) => {
          const status = inv.status
          if (!acc[status]) acc[status] = { count: 0, amount: 0 }
          acc[status].count++
          acc[status].amount += Number(inv.total_amount)
          return acc
        }, {} as Record<string, { count: number; amount: number }>)

        const revenueByStatus = Object.entries(statusGroups).map(([status, data]) => ({
          status,
          ...data
        }))

        // Invoice stats
        const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0)
        const paidInvoices = invoices.filter(inv => inv.status === 'paid').length
        const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length
        const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length
        const avgAmount = invoices.length > 0 ? totalRevenue / invoices.length : 0

        // Payment stats
        const paymentsByMethod: Record<string, { count: number; amount: number }> = {}
        if (payments) {
          payments.forEach(pay => {
            const method = pay.payment_method
            if (!paymentsByMethod[method]) paymentsByMethod[method] = { count: 0, amount: 0 }
            paymentsByMethod[method].count++
            paymentsByMethod[method].amount += Number(pay.amount)
          })
        }

        const paymentByMethod = Object.entries(paymentsByMethod).map(([method, data]) => ({
          method,
          ...data
        }))

        // Transparency scores
        let avgScore = 0
        const scoreDistribution: Record<string, number> = {
          '0-20': 0,
          '21-40': 0,
          '41-60': 0,
          '61-80': 0,
          '81-100': 0
        }

        if (scores && scores.length > 0) {
          avgScore = scores.reduce((sum, s) => sum + s.overall_score, 0) / scores.length
          
          scores.forEach(s => {
            const score = s.overall_score
            if (score <= 20) scoreDistribution['0-20']++
            else if (score <= 40) scoreDistribution['21-40']++
            else if (score <= 60) scoreDistribution['41-60']++
            else if (score <= 80) scoreDistribution['61-80']++
            else scoreDistribution['81-100']++
          })
        }

        const transparencyDist = Object.entries(scoreDistribution).map(([range, count]) => ({
          range,
          count
        }))

        // Customer stats
        const totalCustomers = customers?.length || 0
        const newCustomers = customers?.filter(c => {
          if (!dateFilter) return false
          return new Date(c.created_at) >= new Date(dateFilter)
        }).length || 0

        setReportData({
          revenue: {
            total: totalRevenue,
            byMonth: revenueByMonth,
            byStatus: revenueByStatus
          },
          customers: {
            total: totalCustomers,
            new: newCustomers,
            active: totalCustomers
          },
          invoices: {
            total: invoices.length,
            paid: paidInvoices,
            pending: pendingInvoices,
            overdue: overdueInvoices,
            avgAmount: avgAmount
          },
          payments: {
            total: payments?.length || 0,
            totalAmount: payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
            byMethod: paymentByMethod
          },
          transparency: {
            avgScore: avgScore,
            distribution: transparencyDist
          }
        })
      }
    } catch (error) {
      console.error('Error loading report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    if (!reportData) return

    const reportText = `
HONESTINVOICE FINANCIAL REPORT
Generated: ${new Date().toLocaleString()}
Period: ${dateRange}

REVENUE SUMMARY
--------------
Total Revenue: $${reportData.revenue.total.toFixed(2)}

INVOICE SUMMARY
--------------
Total Invoices: ${reportData.invoices.total}
Paid: ${reportData.invoices.paid}
Pending: ${reportData.invoices.pending}
Overdue: ${reportData.invoices.overdue}
Average Amount: $${reportData.invoices.avgAmount.toFixed(2)}

CUSTOMER SUMMARY
---------------
Total Customers: ${reportData.customers.total}
New Customers (this period): ${reportData.customers.new}

PAYMENT SUMMARY
--------------
Total Payments: ${reportData.payments.total}
Total Amount: $${reportData.payments.totalAmount.toFixed(2)}

TRANSPARENCY SCORE
-----------------
Average Score: ${reportData.transparency.avgScore.toFixed(1)}%
    `.trim()

    const blob = new Blob([reportText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `honestinvoice-report-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading reports...</div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No data available</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Reports</h2>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive financial and operational insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'revenue', label: 'Revenue', icon: DollarSign },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'invoices', label: 'Invoices', icon: FileText },
            { id: 'payments', label: 'Payments', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                selectedReport === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {selectedReport === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="h-8 w-8 text-primary-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                ${reportData.revenue.total.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <FileText className="h-8 w-8 text-accent-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {reportData.invoices.total}
              </div>
              <div className="text-sm text-gray-600">Total Invoices</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {reportData.customers.total}
              </div>
              <div className="text-sm text-gray-600">Total Customers</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {reportData.transparency.avgScore.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Avg Transparency</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.revenue.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={reportData.revenue.byStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {reportData.revenue.byStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {selectedReport === 'revenue' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Month</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={reportData.revenue.byMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#2563EB" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Status</h3>
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Status</th>
                  <th className="text-right py-2">Count</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {reportData.revenue.byStatus.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 capitalize">{item.status}</td>
                    <td className="text-right py-2">{item.count}</td>
                    <td className="text-right py-2">${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {selectedReport === 'payments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={reportData.payments.byMethod}
                    dataKey="count"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {reportData.payments.byMethod.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Total Payments</div>
                  <div className="text-3xl font-bold text-gray-900">{reportData.payments.total}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                  <div className="text-3xl font-bold text-gray-900">${reportData.payments.totalAmount.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Average Payment</div>
                  <div className="text-3xl font-bold text-gray-900">
                    ${reportData.payments.total > 0 ? (reportData.payments.totalAmount / reportData.payments.total).toFixed(2) : '0.00'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other report views can be added similarly */}
    </div>
  )
}
