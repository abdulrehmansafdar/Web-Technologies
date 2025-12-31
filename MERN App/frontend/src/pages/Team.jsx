/**
 * ===========================================
 * Team Page Component
 * ===========================================
 * 
 * Displays team members and their information.
 * Allows admins to manage team members.
 * 
 * @module pages/Team
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Loader2,
  Shield,
  Calendar,
  MoreVertical,
  UserPlus,
  X,
  Star,
  Award,
  Clock
} from 'lucide-react';

/**
 * Team Component
 * 
 * Features:
 * - View all team members
 * - Search team members
 * - View member details
 * - Admin: Invite new members
 */
const Team = () => {
  const { user } = useAuth();

  // State
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' });
  const [inviting, setInviting] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  /**
   * Fetch team members
   */
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await api.get('/users/team/members');
        setMembers(response.data.data.members);
      } catch (error) {
        console.error('Failed to fetch team members:', error);
        toast.error('Failed to load team members');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  /**
   * Handle invite member
   */
  const handleInvite = async (e) => {
    e.preventDefault();

    if (!inviteForm.email.trim()) {
      toast.error('Email is required');
      return;
    }

    setInviting(true);

    try {
      await api.post('/users/team/invite', inviteForm);
      toast.success('Invitation sent successfully');
      setShowInviteModal(false);
      setInviteForm({ email: '', role: 'member' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  /**
   * Filter members by search term
   */
  const filteredMembers = members.filter(member => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      member.name?.toLowerCase().includes(search) ||
      member.email?.toLowerCase().includes(search) ||
      member.jobTitle?.toLowerCase().includes(search)
    );
  });

  /**
   * Get user initials for avatar fallback
   */
  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  /**
   * Get role badge styling - Professional colors
   */
  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-slate-800 text-white';
      case 'manager':
        return 'bg-primary-600 text-white';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  /**
   * Get role icon
   */
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Award className="w-3.5 h-3.5" />;
      case 'manager':
        return <Star className="w-3.5 h-3.5" />;
      default:
        return <Shield className="w-3.5 h-3.5" />;
    }
  };

  /**
   * Format date safely
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Team Members</h1>
              <p className="text-slate-300 mt-1">
                {members.length} talented {members.length !== 1 ? 'people' : 'person'} in your team
              </p>
            </div>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-800 font-semibold rounded-xl hover:bg-slate-100 transition-all shadow-lg"
            >
              <UserPlus className="w-5 h-5" />
              Invite Member
            </button>
          )}
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-800"></div>
              <span className="text-slate-600">{members.filter(m => m.role === 'admin').length} Admins</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary-600"></div>
              <span className="text-slate-600">{members.filter(m => m.role === 'manager').length} Managers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              <span className="text-slate-600">{members.filter(m => m.role === 'user' || m.role === 'member').length} Members</span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Grid */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            No Team Members Found
          </h3>
          <p className="text-slate-500 max-w-md mx-auto">
            {searchTerm
              ? 'No members match your search criteria. Try adjusting your search terms.'
              : 'Your team is empty. Start by inviting team members to collaborate.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <div
              key={member._id}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-primary-200 transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedMember(member)}
            >
              {/* Card Header - Gradient Background */}
              <div className="h-20 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(85,107,47,0.3),transparent)]"></div>
                {/* Role Badge - Top Right */}
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${getRoleBadge(member.role)}`}>
                    {getRoleIcon(member.role)}
                    <span className="capitalize">{member.role}</span>
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="px-6 pb-6 -mt-10">
                {/* Avatar */}
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-2xl border-4 border-white bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <span className="text-2xl font-bold text-primary-700">
                      {getInitials(member.name)}
                    </span>
                  </div>
                  {/* Online indicator */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-3 border-white rounded-full"></div>
                </div>

                {/* Member Info */}
                <div className="mt-4">
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary-700 transition-colors">
                    {member.name}
                    {member._id === user?._id && (
                      <span className="ml-2 text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">You</span>
                    )}
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {member.jobTitle || member.department || 'Team Member'}
                  </p>
                </div>

                {/* Divider */}
                <div className="my-4 h-px bg-slate-100"></div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-primary-50 transition-colors">
                      <Mail className="w-4 h-4 text-slate-500 group-hover:text-primary-600" />
                    </div>
                    <span className="text-slate-600 truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-primary-50 transition-colors">
                      <Clock className="w-4 h-4 text-slate-500 group-hover:text-primary-600" />
                    </div>
                    <span className="text-slate-600">Joined {formatDate(member.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Invite Team Member
                  </h2>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleInvite} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="colleague@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-5 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-900 transition-colors disabled:opacity-50"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Send Invite
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-fade-in overflow-hidden">
            {/* Header Banner */}
            <div className="h-28 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(85,107,47,0.3),transparent)]"></div>
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-8 pb-8 -mt-14">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="w-28 h-28 rounded-2xl border-4 border-white bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-xl">
                  <span className="text-4xl font-bold text-primary-700">
                    {getInitials(selectedMember.name)}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="text-center mt-5">
                <h2 className="text-2xl font-bold text-slate-800">
                  {selectedMember.name}
                </h2>
                <p className="text-slate-500 mt-1">{selectedMember.jobTitle || selectedMember.department || 'Team Member'}</p>
                <div className="mt-3">
                  <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold ${getRoleBadge(selectedMember.role)}`}>
                    {getRoleIcon(selectedMember.role)}
                    <span className="capitalize">{selectedMember.role}</span>
                  </span>
                </div>
              </div>

              {/* Bio */}
              {selectedMember.bio && (
                <p className="text-slate-600 text-center mt-5 text-sm bg-slate-50 rounded-xl p-4">
                  "{selectedMember.bio}"
                </p>
              )}

              {/* Details */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm">
                    <Mail className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedMember.email}</p>
                  </div>
                </div>

                {selectedMember.phone && (
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm">
                      <Phone className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Phone</p>
                      <p className="text-sm font-semibold text-slate-800">{selectedMember.phone}</p>
                    </div>
                  </div>
                )}

                {selectedMember.location && (
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm">
                      <MapPin className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Location</p>
                      <p className="text-sm font-semibold text-slate-800">{selectedMember.location}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm">
                    <Calendar className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Member Since</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {formatDate(selectedMember.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
