import { TrendingUp, DollarSign, FileText, Shield } from 'lucide-react'
import { useSubscription, FeatureKeys } from '../hooks/useSubscription';
import PaywallModal from './PaywallModal';

interface AnalyticsProps {
  stats: {
    totalInvoices: number
    totalRevenue: number
    paidInvoices: number
    avgTransparencyScore: number
  }
}

export default function Analytics({ stats }: AnalyticsProps) {
  const { userHasFeature, isLoadingFeatures } = useSubscription();

  if (isLoadingFeatures) {
    return <div>Loading subscription data...</div>;
  }

  const hasAdvancedAnalytics = userHasFeature(FeatureKeys.ADVANCED_ANALYTICS);

  if (!hasAdvancedAnalytics) {
    return <PaywallModal feature="Advanced Analytics" />;
  }

  const paymentRate = stats.totalInvoices > 0
    ? ((stats.paidInvoices / stats.totalInvoices) * 100).toFixed(1)
    : 0

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Business Analytics</h2>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="text-3xl font-bold mb-1">{stats.totalInvoices}</div>
          <div className="text-primary-100">Total Invoices</div>
        </div>

        <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="text-3xl font-bold mb-1">
            ${stats.totalRevenue.toLocaleString()}
          </div>
          <div className="text-accent-100">Total Revenue</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{paymentRate}%</div>
          <div className="text-green-100">Payment Rate</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Shield className="w-8 h-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {stats.avgTransparencyScore.toFixed(0)}
          </div>
          <div className="text-blue-100">Avg Transparency Score</div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Status Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Paid Invoices</span>
              <span className="font-semibold text-green-600">{stats.paidInvoices}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pending Invoices</span>
              <span className="font-semibold text-yellow-600">
                {stats.totalInvoices - stats.paidInvoices}
              </span>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-medium">Total</span>
                <span className="font-bold text-gray-900">{stats.totalInvoices}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Insights</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-semibold text-gray-900">
                ${stats.totalRevenue.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Average Invoice Value</span>
              <span className="font-semibold text-gray-900">
                ${stats.totalInvoices > 0
                  ? (stats.totalRevenue / stats.totalInvoices).toFixed(2)
                  : 0}
              </span>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-medium">Payment Rate</span>
                <span className="font-bold text-green-600">{paymentRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transparency Score Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transparency Performance</h3>
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.avgTransparencyScore.toFixed(0)}
                </div>
                <div className="text-xs text-blue-600">Score</div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Transparency Rating</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.avgTransparencyScore >= 80 ? 'Excellent' :
                   stats.avgTransparencyScore >= 60 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    stats.avgTransparencyScore >= 80 ? 'bg-green-500' :
                    stats.avgTransparencyScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${stats.avgTransparencyScore}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Your invoices demonstrate{' '}
              {stats.avgTransparencyScore >= 80 ? 'exceptional' :
               stats.avgTransparencyScore >= 60 ? 'good' : 'room for improvement in'}{' '}
              transparency with comprehensive documentation and clear fee structures.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
