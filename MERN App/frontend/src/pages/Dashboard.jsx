/**
 * ===========================================
 * Dashboard Page Component
 * ===========================================
 * 
 * Main dashboard showing project and task statistics,
 * recent activity, and upcoming deadlines.
 * 
 * @module pages/Dashboard
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FolderKanban,
  CheckSquare,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar,
  ArrowRight,
  Loader2
} from 'lucide-react';

/**
 * Dashboard Component
 * 
 * Displays:
 * - Welcome message with user's name
 * - Key statistics cards
 * - Recent activity feed
 * - Upcoming deadlines
 */
const Dashboard = () => {
  const { user } = useAuth();
  
  // State
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch dashboard data on mount
   */
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all dashboard data in parallel
        const [statsRes, activityRes, deadlinesRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/activity?limit=5'),
          api.get('/dashboard/deadlines?days=7')
        ]);

        setStats(statsRes.data.data);
        setActivity(activityRes.data.data.activity);
        setDeadlines(deadlinesRes.data.data.tasks);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  /**
   * Format date for display
   */
  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = d - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `${days} days`;
    return d.toLocaleDateString();
  };

  /**
   * Get status color class
   */
  const getStatusColor = (status) => {
    const colors = {
      'todo': 'bg-slate-100 text-slate-700',
      'in-progress': 'bg-primary-100 text-primary-700',
      'in-review': 'bg-warning-100 text-warning-700',
      'completed': 'bg-success-100 text-success-700'
    };
    return colors[status] || colors.todo;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section - Dark gray with olive accent */}
      <div className="bg-slate-800 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-bold">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-400 mt-2">
            Here's what's happening with your projects today.
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Projects */}
        <div className="card hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Total Projects</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {stats?.projects?.total || 0}
              </p>
            </div>
            <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center">
              <FolderKanban className="w-7 h-7 text-primary-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-primary-600 font-medium">{stats?.projects?.['in-progress'] || 0} active</span>
            <span className="text-slate-300 mx-2">•</span>
            <span className="text-slate-500">{stats?.projects?.completed || 0} completed</span>
          </div>
        </div>

        {/* Total Tasks */}
        <div className="card hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Total Tasks</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {stats?.tasks?.total || 0}
              </p>
            </div>
            <div className="w-14 h-14 bg-success-100 rounded-2xl flex items-center justify-center">
              <CheckSquare className="w-7 h-7 text-success-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-success-600 font-medium">{stats?.tasks?.completed || 0} done</span>
            <span className="text-slate-300 mx-2">•</span>
            <span className="text-slate-500">{stats?.tasks?.['in-progress'] || 0} in progress</span>
          </div>
        </div>

        {/* My Tasks */}
        <div className="card hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">My Tasks</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {stats?.myTasks?.total || 0}
              </p>
            </div>
            <div className="w-14 h-14 bg-olive-100 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-olive-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-olive-600 font-medium">{stats?.myTasks?.todo || 0} pending</span>
            <span className="text-slate-300 mx-2">•</span>
            <span className="text-slate-500">{stats?.myTasks?.completed || 0} completed</span>
          </div>
        </div>

        {/* Overdue */}
        <div className="card hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Due This Week</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {stats?.dueThisWeek || 0}
              </p>
            </div>
            <div className="w-14 h-14 bg-warning-100 rounded-2xl flex items-center justify-center">
              <Clock className="w-7 h-7 text-warning-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {stats?.overdue > 0 ? (
              <span className="text-danger-600 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-4 h-4" />
                {stats.overdue} overdue
              </span>
            ) : (
              <span className="text-success-600 font-medium">All on track!</span>
            )}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Recent Activity</h2>
            <Link to="/tasks" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {activity.length > 0 ? (
            <div className="space-y-4">
              {activity.map((item, index) => (
                <div key={item.id || index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {item.user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 truncate font-medium">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`badge ${getStatusColor(item.status)}`}>
                        {item.status?.replace('-', ' ')}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500">No recent activity</p>
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Upcoming Deadlines</h2>
            <Link to="/tasks" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {deadlines.length > 0 ? (
            <div className="space-y-3">
              {deadlines.map((task) => (
                <div
                  key={task._id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: task.project?.color || '#556b2f' }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {task.project?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className={`text-sm font-medium ${
                      new Date(task.dueDate) < new Date() 
                        ? 'text-danger-600' 
                        : 'text-slate-600'
                    }`}>
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500">No upcoming deadlines</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link
          to="/projects"
          className="btn-primary"
        >
          <FolderKanban className="w-5 h-5" />
          New Project
        </Link>
        <Link
          to="/tasks"
          className="btn-secondary"
        >
          <CheckSquare className="w-5 h-5" />
          View All Tasks
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
