import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Star, TrendingUp, Users, Award, Shield } from 'lucide-react'

interface SatisfactionMetrics {
  avgCsatScore: number
  avgNpsScore: number
  totalResponses: number
  transparencyRating: number
}

export default function SocialProof() {
  const [metrics, setMetrics] = useState<SatisfactionMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      // Get aggregated satisfaction data
      const { data, error } = await supabase
        .from('client_satisfaction')
        .select('csat_score, nps_score, transparency_rating')
      
      if (error) throw error

      if (data && data.length > 0) {
        const avgCsat = data.reduce((sum, item) => sum + (item.csat_score || 0), 0) / data.length
        const avgNps = data.reduce((sum, item) => sum + (item.nps_score || 0), 0) / data.length
        const avgTransparency = data.reduce((sum, item) => sum + (item.transparency_rating || 0), 0) / data.length

        setMetrics({
          avgCsatScore: Math.round(avgCsat * 10) / 10,
          avgNpsScore: Math.round(avgNps),
          totalResponses: data.length,
          transparencyRating: Math.round(avgTransparency * 10) / 10,
        })
      }
    } catch (error) {
      console.error('Error loading metrics:', error)
      // Set to null to hide the component when there's an error
      setMetrics(null)
    } finally {
      setLoading(false)
    }
  }

  const getNpsLabel = (score: number) => {
    if (score >= 70) return { label: 'Excellent', color: 'text-accent-600' }
    if (score >= 50) return { label: 'Great', color: 'text-blue-600' }
    if (score >= 30) return { label: 'Good', color: 'text-yellow-600' }
    return { label: 'Needs Improvement', color: 'text-orange-600' }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  const npsInfo = getNpsLabel(metrics.avgNpsScore)

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-accent-100 rounded-lg">
          <Award className="h-6 w-6 text-accent-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Client Trust Metrics</h2>
          <p className="text-sm text-gray-600">
            Real satisfaction data from verified clients
          </p>
        </div>
      </div>

      {/* Show message when no data available */}
      {metrics.totalResponses === 0 ? (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No client satisfaction data available yet</p>
          <p className="text-sm text-gray-500">
            Data will appear here once you start collecting client feedback
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer Satisfaction Score */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Star className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">CSAT Score</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-blue-600">
                  {metrics.avgCsatScore}
                </span>
                <span className="text-gray-600">/5.0</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Customer Satisfaction</p>
              
              {/* Star Rating Visual */}
              <div className="flex gap-1 mt-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(metrics.avgCsatScore)
                        ? 'fill-blue-600 text-blue-600'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Net Promoter Score */}
            <div className="bg-gradient-to-br from-accent-50 to-emerald-50 p-6 rounded-lg border border-accent-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-accent-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-accent-600" />
                </div>
                <h3 className="font-semibold text-gray-900">NPS Score</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-accent-600">
                  {metrics.avgNpsScore}
                </span>
                <span className={`text-sm font-medium ${npsInfo.color}`}>
                  {npsInfo.label}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Net Promoter Score</p>
              
              {/* NPS Bar */}
              <div className="mt-3 bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-accent-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(metrics.avgNpsScore, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Transparency Rating */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Transparency</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-purple-600">
                  {metrics.transparencyRating}
                </span>
                <span className="text-gray-600">/5.0</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Clarity & Honesty Rating</p>
              
              {/* Percentage Circle */}
              <div className="mt-3 text-sm font-medium text-purple-700">
                {Math.round((metrics.transparencyRating / 5) * 100)}% Transparency
              </div>
            </div>
          </div>

          {/* Response Count */}
          {metrics.totalResponses > 0 && (
            <div className="mt-6 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <Users className="h-4 w-4" />
              <span>
                Based on <strong className="text-gray-900">{metrics.totalResponses}</strong> verified client responses
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}