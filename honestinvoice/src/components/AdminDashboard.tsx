import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  CreditCard, 
  FileText, 
  Activity, 
  Shield, 
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Database,
  UserPlus,
  Trash2,
  ShieldCheck
} from 'lucide-react';

interface AdminStats {
  users: {
    total: number;
    free: number;
    pro: number;
    business: number;
  };
  subscriptions: {
    total: number;
    active: number;
    canceled: number;
    revenue: number;
  };
  invoices: {
    total: number;
    paid: number;
    pending: number;
    total_revenue: number;
  };
  api_usage: {
    total_requests: number;
    by_tier: {
      free: number;
      pro: number;
      business: number;
    };
  };
}

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  subscription: {
    plan_type: string;
    status: string;
  };
}

interface SecurityEvent {
  id: number;
  event_type: string;
  severity: string;
  description: string;
  ip_address: string;
  created_at: string;
}

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
  created_by: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'security' | 'admins'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Not authenticated');
        return;
      }

      if (activeTab === 'dashboard') {
        const { data, error } = await supabase.functions.invoke('admin-dashboard', {
          body: {},
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (error) throw error;
        setStats(data.data);
      } else if (activeTab === 'users') {
        const { data, error } = await supabase.functions.invoke('admin-dashboard', {
          body: {},
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (error) throw error;

        const usersResponse = await supabase.functions.invoke('admin-dashboard?action=users', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (usersResponse.data) {
          setUsers(usersResponse.data.data || []);
        }
      } else if (activeTab === 'security') {
        const { data, error } = await supabase.functions.invoke('admin-dashboard?action=security_events', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (error) throw error;
        setSecurityEvents(data.data || []);
      } else if (activeTab === 'admins') {
        // Load admin users from admin_users table
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAdminUsers(data || []);
      }

      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Not authenticated');
        return;
      }

      // Use edge function to add admin
      const { data, error } = await supabase.functions.invoke('admin-users-management', {
        body: { 
          action: 'add_admin',
          email: newAdminEmail.toLowerCase().trim()
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data.success) {
        setNewAdminEmail('');
        setError(null);
        // Reload admin users
        loadDashboardData();
      } else {
        setError(data.error || 'Failed to add admin user');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add admin user');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove admin privileges from ${email}?`)) {
      return;
    }

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Not authenticated');
        return;
      }

      // Use edge function to remove admin
      const { data, error } = await supabase.functions.invoke('admin-users-management', {
        body: { 
          action: 'remove_admin',
          user_id: userId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data.success) {
        setError(null);
        // Reload admin users
        loadDashboardData();
      } else {
        setError(data.error || 'Failed to remove admin user');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove admin user');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
            <h3 className="text-red-900 font-semibold">Error</h3>
          </div>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-primary mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">HonestInvoice Platform Administration</p>
              </div>
            </div>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to App
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`${
                activeTab === 'dashboard'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <Activity className="w-5 h-5 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`${
                activeTab === 'security'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <Shield className="w-5 h-5 inline mr-2" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`${
                activeTab === 'admins'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <ShieldCheck className="w-5 h-5 inline mr-2" />
              Admin Users
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Users */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                  <span className="text-2xl font-bold text-gray-900">{stats.users.total}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Users</h3>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Free: {stats.users.free}</div>
                  <div>Pro: {stats.users.pro}</div>
                  <div>Business: {stats.users.business}</div>
                </div>
              </div>

              {/* Subscriptions */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <CreditCard className="w-8 h-8 text-green-600" />
                  <span className="text-2xl font-bold text-gray-900">{stats.subscriptions.active}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Active Subscriptions</h3>
                <div className="text-xs text-gray-500">
                  MRR: {formatCurrency(stats.subscriptions.revenue)}
                </div>
              </div>

              {/* Invoices */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <FileText className="w-8 h-8 text-purple-600" />
                  <span className="text-2xl font-bold text-gray-900">{stats.invoices.total}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Invoices</h3>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Paid: {stats.invoices.paid}</div>
                  <div>Pending: {stats.invoices.pending}</div>
                </div>
              </div>

              {/* Revenue */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-8 h-8 text-yellow-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.invoices.total_revenue)}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Revenue</h3>
                <div className="text-xs text-gray-500">
                  From {stats.invoices.paid} paid invoices
                </div>
              </div>
            </div>

            {/* API Usage */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Database className="w-6 h-6 text-primary mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">API Usage</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-900">{stats.api_usage.total_requests}</div>
                  <div className="text-sm text-gray-600 mt-1">Total Requests</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-900">{stats.api_usage.by_tier.free}</div>
                  <div className="text-sm text-blue-600 mt-1">Free Tier</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-900">{stats.api_usage.by_tier.pro}</div>
                  <div className="text-sm text-green-600 mt-1">Pro Tier</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded">
                  <div className="text-2xl font-bold text-purple-900">{stats.api_usage.by_tier.business}</div>
                  <div className="text-sm text-purple-600 mt-1">Business Tier</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Sign In</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      <div className="text-xs text-gray-500">{user.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.subscription.plan_type === 'business' ? 'bg-purple-100 text-purple-800' :
                        user.subscription.plan_type === 'pro' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.subscription.plan_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.subscription.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Security Events</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {securityEvents.map((event) => (
                <div key={event.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full mr-3 ${
                          event.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          event.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {event.severity.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{event.event_type}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{event.description}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        IP: {event.ip_address} • {formatDate(event.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="space-y-6">
            {/* Add Admin User Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Admin User</h3>
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="admin-email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddAdmin();
                      }
                    }}
                  />
                </div>
                <button
                  onClick={handleAddAdmin}
                  disabled={loading}
                  className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Add Admin
                </button>
              </div>
              {error && error.includes('email') && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            {/* Admin Users List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Current Admin Users</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {adminUsers.length} admin user{adminUsers.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Added On
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Added By
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {adminUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No admin users found. Add the first admin user above.
                        </td>
                      </tr>
                    ) : (
                      adminUsers.map((admin) => (
                        <tr key={admin.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <ShieldCheck className="w-5 h-5 text-primary mr-2" />
                              <span className="text-sm font-medium text-gray-900">{admin.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(admin.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {admin.created_by || 'System'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <button
                              onClick={() => handleRemoveAdmin(admin.user_id, admin.email)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Important:</strong> Admin users have full access to the system including user management, 
                    subscriptions, and sensitive data. Only grant admin privileges to trusted users.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
