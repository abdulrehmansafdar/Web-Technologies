/**
 * ===========================================
 * Tasks Page Component
 * ===========================================
 * 
 * Shows all tasks assigned to the current user.
 * Provides filtering, sorting, and task management.
 * 
 * @module pages/Tasks
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Filter,
  Search,
  Loader2,
  ExternalLink,
  ChevronDown,
  Check,
  CircleDot,
  ListTodo,
  Target,
  TrendingUp,
  Zap
} from 'lucide-react';

/**
 * Tasks Component
 * 
 * Features:
 * - View all assigned tasks
 * - Filter by status and priority
 * - Search tasks
 * - Quick status update
 */
const Tasks = () => {
  // State
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');

  /**
   * Fetch user's tasks
   */
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.get('/tasks/my-tasks');
        setTasks(response.data.data.tasks);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        toast.error('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  /**
   * Update task status
   */
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      
      setTasks(prev =>
        prev.map(task =>
          task._id === taskId ? { ...task, status: newStatus } : task
        )
      );

      toast.success('Task status updated');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  /**
   * Get priority badge styling - Enhanced professional colors
   */
  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-slate-100 text-slate-600 border border-slate-200',
      medium: 'bg-blue-50 text-blue-700 border border-blue-200',
      high: 'bg-amber-50 text-amber-700 border border-amber-200',
      critical: 'bg-red-50 text-red-700 border border-red-200'
    };
    return styles[priority] || styles.medium;
  };

  /**
   * Get status badge styling - Enhanced
   */
  const getStatusBadge = (status) => {
    const styles = {
      'todo': 'bg-slate-100 text-slate-600 border border-slate-200',
      'in-progress': 'bg-blue-50 text-blue-700 border border-blue-200',
      'in-review': 'bg-amber-50 text-amber-700 border border-amber-200',
      'completed': 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    };
    return styles[status] || styles.todo;
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'todo':
        return <CircleDot className="w-4 h-4" />;
      case 'in-progress':
        return <Clock className="w-4 h-4" />;
      case 'in-review':
        return <AlertTriangle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <CircleDot className="w-4 h-4" />;
    }
  };

  /**
   * Filter and sort tasks
   */
  const filteredTasks = tasks
    .filter(task => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          task.title.toLowerCase().includes(search) ||
          task.description?.toLowerCase().includes(search) ||
          task.project?.name?.toLowerCase().includes(search)
        );
      }
      return true;
    })
    .filter(task => {
      // Status filter
      if (statusFilter !== 'all') {
        return task.status === statusFilter;
      }
      return true;
    })
    .filter(task => {
      // Priority filter
      if (priorityFilter !== 'all') {
        return task.priority === priorityFilter;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'priority':
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'status':
          const statusOrder = { 'todo': 0, 'in-progress': 1, 'in-review': 2, 'completed': 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  /**
   * Check if task is overdue
   */
  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  /**
   * Check if task is due soon (within 3 days)
   */
  const isDueSoon = (dueDate, status) => {
    if (!dueDate || status === 'completed') return false;
    const due = new Date(dueDate);
    const now = new Date();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    return due > now && due - now < threeDays;
  };

  /**
   * Format date nicely
   */
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
            <ListTodo className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Tasks</h1>
            <p className="text-slate-300 mt-1">Track and manage all your assigned tasks</p>
          </div>
        </div>
      </div>

      {/* Stats Cards - Enhanced Design */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-slate-800">
                {tasks.filter(t => t.status === 'todo').length}
              </p>
              <p className="text-sm font-medium text-slate-500 mt-1">To Do</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-slate-200 transition-colors">
              <CircleDot className="w-6 h-6 text-slate-600" />
            </div>
          </div>
          <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-slate-400 rounded-full transition-all"
              style={{ width: `${tasks.length ? (tasks.filter(t => t.status === 'todo').length / tasks.length * 100) : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-lg hover:border-blue-200 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-slate-800">
                {tasks.filter(t => t.status === 'in-progress').length}
              </p>
              <p className="text-sm font-medium text-slate-500 mt-1">In Progress</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 h-1.5 bg-blue-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${tasks.length ? (tasks.filter(t => t.status === 'in-progress').length / tasks.length * 100) : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-lg hover:border-amber-200 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-slate-800">
                {tasks.filter(t => t.status === 'in-review').length}
              </p>
              <p className="text-sm font-medium text-slate-500 mt-1">In Review</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
              <Target className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-3 h-1.5 bg-amber-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${tasks.length ? (tasks.filter(t => t.status === 'in-review').length / tasks.length * 100) : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-lg hover:border-emerald-200 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-slate-800">
                {tasks.filter(t => t.status === 'completed').length}
              </p>
              <p className="text-sm font-medium text-slate-500 mt-1">Completed</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
              <Zap className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-3 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${tasks.length ? (tasks.filter(t => t.status === 'completed').length / tasks.length * 100) : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filters - Enhanced */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tasks by name or project..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="in-review">In Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="dueDate">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="status">Sort by Status</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List - Enhanced Design */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">No Tasks Found</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'No tasks match your current filters. Try adjusting your search criteria.'
              : 'You have no assigned tasks yet. Tasks assigned to you will appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredTasks.map((task, index) => (
            <div
              key={task._id}
              className={`p-5 hover:bg-slate-50 transition-all ${
                index !== filteredTasks.length - 1 ? 'border-b border-slate-100' : ''
              } ${task.status === 'completed' ? 'bg-slate-50/50' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* Status Checkbox - Enhanced */}
                <button
                  onClick={() =>
                    updateTaskStatus(
                      task._id,
                      task.status === 'completed' ? 'todo' : 'completed'
                    )
                  }
                  className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    task.status === 'completed'
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                      : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50'
                  }`}
                >
                  {task.status === 'completed' && <Check className="w-4 h-4" />}
                </button>

                {/* Task Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className={`font-semibold text-slate-800 ${
                        task.status === 'completed' ? 'line-through text-slate-400' : ''
                      }`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Go to Project - Enhanced */}
                    {task.project && (
                      <Link
                        to={`/projects/${task.project._id}`}
                        className="flex-shrink-0 p-2.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                        title="View in project"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </Link>
                    )}
                  </div>

                  {/* Task Meta - Enhanced */}
                  <div className="flex flex-wrap items-center gap-2.5 mt-4">
                    {/* Project Tag */}
                    {task.project && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: task.project.color || '#556b2f' }}
                        />
                        <span className="text-sm font-medium text-slate-600">{task.project.name}</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusBadge(task.status)}`}>
                      {getStatusIcon(task.status)}
                      <span className="capitalize">{task.status.replace('-', ' ')}</span>
                    </span>

                    {/* Priority Badge */}
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${getPriorityBadge(task.priority)}`}>
                      {task.priority}
                    </span>

                    {/* Due Date - Enhanced */}
                    {task.dueDate && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        isOverdue(task.dueDate, task.status)
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : isDueSoon(task.dueDate, task.status)
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(task.dueDate)}
                        {isOverdue(task.dueDate, task.status) && (
                          <span className="ml-1 text-red-600">(Overdue)</span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Quick Status Update - Enhanced */}
                  {task.status !== 'completed' && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                      <span className="text-xs font-medium text-slate-400">Move to:</span>
                      <div className="flex flex-wrap gap-2">
                        {['todo', 'in-progress', 'in-review', 'completed']
                          .filter(s => s !== task.status)
                          .map((status) => (
                            <button
                              key={status}
                              onClick={() => updateTaskStatus(task._id, status)}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105 ${getStatusBadge(status)}`}
                            >
                              {status.replace('-', ' ')}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary - Enhanced */}
      {filteredTasks.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <span className="font-medium">Showing {filteredTasks.length} of {tasks.length} tasks</span>
          {tasks.filter(t => t.status === 'completed').length > 0 && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
              {Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)}% Complete
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Tasks;
