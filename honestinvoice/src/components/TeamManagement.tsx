import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { Users, UserPlus, Mail, Shield, Trash2, Edit2, X, Save } from 'lucide-react'

interface TeamMember {
  id: string
  user_id: string
  company_id: string
  role: string
  permissions: string[]
  is_active: boolean
  joined_at: string
}

interface User {
  id: string
  email: string
  full_name: string | null
}

export default function TeamManagement() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [users, setUsers] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [newMember, setNewMember] = useState({
    email: '',
    role: 'member',
    permissions: [] as string[]
  })

  const availableRoles = [
    { value: 'owner', label: 'Owner', description: 'Full access to all features' },
    { value: 'admin', label: 'Administrator', description: 'Manage team and settings' },
    { value: 'manager', label: 'Manager', description: 'Create and manage invoices' },
    { value: 'member', label: 'Member', description: 'View and create invoices' },
    { value: 'viewer', label: 'Viewer', description: 'View-only access' }
  ]

  const availablePermissions = [
    'create_invoices',
    'edit_invoices',
    'delete_invoices',
    'manage_customers',
    'view_reports',
    'manage_payments',
    'manage_team',
    'manage_settings'
  ]

  useEffect(() => {
    loadTeamMembers()
  }, [])

  const loadTeamMembers = async () => {
    try {
      setLoading(true)

      // Get current user's company
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: currentUserData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!currentUserData?.company_id) return

      // Load team members
      const { data: membersData } = await supabase
        .from('team_members')
        .select('*')
        .eq('company_id', currentUserData.company_id)
        .order('joined_at', { ascending: false })

      if (membersData) {
        setTeamMembers(membersData)

        // Load user details for all team members
        const userIds = membersData.map(m => m.user_id)
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email, full_name')
          .in('id', userIds)

        if (usersData) {
          const usersMap: Record<string, User> = {}
          usersData.forEach(u => {
            usersMap[u.id] = u
          })
          setUsers(usersMap)
        }
      }
    } catch (error) {
      console.error('Error loading team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const inviteTeamMember = async () => {
    if (!newMember.email.trim()) {
      toast.error('Please enter an email address')
      return
    }

    try {
      // Get current user's company
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: currentUserData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!currentUserData?.company_id) return

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', newMember.email.trim())
        .single()

      if (!existingUser) {
        toast.error('User not found. They must create an account first.')
        return
      }

      // Check if already a team member
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('company_id', currentUserData.company_id)
        .single()

      if (existingMember) {
        toast.warning('This user is already a team member.')
        return
      }

      // Create team member record
      const { error } = await supabase
        .from('team_members')
        .insert({
          user_id: existingUser.id,
          company_id: currentUserData.company_id,
          role: newMember.role,
          permissions: newMember.permissions,
          is_active: true,
          joined_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('Team member invited successfully!')
      setShowAddModal(false)
      setNewMember({ email: '', role: 'member', permissions: [] })
      loadTeamMembers()
    } catch (error) {
      console.error('Error inviting team member:', error)
      toast.error('Failed to invite team member. Please try again.')
    }
  }

  const updateTeamMember = async () => {
    if (!editingMember) return

    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          role: editingMember.role,
          permissions: editingMember.permissions,
          is_active: editingMember.is_active
        })
        .eq('id', editingMember.id)

      if (error) throw error

      toast.success('Team member updated successfully!')
      setEditingMember(null)
      loadTeamMembers()
    } catch (error) {
      console.error('Error updating team member:', error)
      toast.error('Failed to update team member. Please try again.')
    }
  }

  const removeTeamMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      toast.success('Team member removed successfully!')
      loadTeamMembers()
    } catch (error) {
      console.error('Error removing team member:', error)
      toast.error('Failed to remove team member. Please try again.')
    }
  }

  const togglePermission = (permission: string) => {
    if (editingMember) {
      const permissions = editingMember.permissions.includes(permission)
        ? editingMember.permissions.filter(p => p !== permission)
        : [...editingMember.permissions, permission]
      setEditingMember({ ...editingMember, permissions })
    } else {
      const permissions = newMember.permissions.includes(permission)
        ? newMember.permissions.filter(p => p !== permission)
        : [...newMember.permissions, permission]
      setNewMember({ ...newMember, permissions })
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-red-100 text-red-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'member': return 'bg-green-100 text-green-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading team members...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage your team members and their permissions
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      {/* Team Members List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Permissions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teamMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p>No team members yet. Invite your first team member!</p>
                </td>
              </tr>
            ) : (
              teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {users[member.user_id]?.full_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {users[member.user_id]?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {member.permissions.slice(0, 3).map(perm => (
                        <span key={perm} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {perm.replace('_', ' ')}
                        </span>
                      ))}
                      {member.permissions.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          +{member.permissions.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.joined_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setEditingMember(member)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeTeamMember(member.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Invite Team Member</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="member@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {availableRoles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availablePermissions.map(permission => (
                    <label key={permission} className="flex items-center gap-2 p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={newMember.permissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{permission.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={inviteTeamMember}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Team Member</h3>
              <button onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member
                </label>
                <div className="text-sm text-gray-900">
                  {users[editingMember.user_id]?.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={editingMember.role}
                  onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {availableRoles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingMember.is_active}
                    onChange={(e) => setEditingMember({ ...editingMember, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availablePermissions.map(permission => (
                    <label key={permission} className="flex items-center gap-2 p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={editingMember.permissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{permission.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEditingMember(null)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={updateTeamMember}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
