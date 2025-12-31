/**
 * ===========================================
 * Projects Page Component
 * ===========================================
 * 
 * Displays all projects with filtering and creation functionality.
 * 
 * @module pages/Projects
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Filter,
  FolderKanban,
  MoreVertical,
  Calendar,
  Users,
  Loader2,
  X
} from 'lucide-react';

/**
 * Projects Component
 * 
 * Features:
 * - Project listing with cards
 * - Search and filter functionality
 * - Create new project modal
 * - Project status indicators
 */
const Projects = () => {
  // State
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state for new project
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    color: '#3B82F6'
  });
  const [creating, setCreating] = useState(false);

  /**
   * Fetch projects from API
   */
  const fetchProjects = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/projects?${params.toString()}`);
      setProjects(response.data.data.projects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [searchQuery, statusFilter]);

  /**
   * Handle create project
   */
  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    if (!newProject.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    setCreating(true);

    try {
      const response = await api.post('/projects', newProject);
      setProjects(prev => [response.data.data.project, ...prev]);
      setShowCreateModal(false);
      setNewProject({
        name: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        color: '#3B82F6'
      });
      toast.success('Project created successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  /**
   * Get status badge styles
   */
  const getStatusBadge = (status) => {
    const styles = {
      'planning': 'bg-slate-100 text-slate-700',
      'in-progress': 'bg-primary-100 text-primary-700',
      'on-hold': 'bg-warning-100 text-warning-700',
      'completed': 'bg-success-100 text-success-700',
      'cancelled': 'bg-danger-100 text-danger-700'
    };
    return styles[status] || styles.planning;
  };

  /**
   * Format status for display
   */
  const formatStatus = (status) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Color options for project - Professional palette
  const colorOptions = [
    '#556b2f', '#1e293b', '#0f766e', '#0369a1',
    '#6366f1', '#a21caf', '#dc2626', '#ea580c'
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
          <p className="text-slate-500 mt-1">Manage and track your projects</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input pl-10 pr-8 appearance-none cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="planning">Planning</option>
            <option value="in-progress">In Progress</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project._id}
              to={`/projects/${project._id}`}
              className="card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
            >
              {/* Project Color Bar */}
              <div
                className="h-1.5 -mx-6 -mt-6 mb-4 rounded-t-xl"
                style={{ backgroundColor: project.color || '#556b2f' }}
              />

              {/* Project Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${project.color}15` }}
                  >
                    <FolderKanban
                      className="w-6 h-6"
                      style={{ color: project.color || '#556b2f' }}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors">
                      {project.name}
                    </h3>
                    <span className={`badge ${getStatusBadge(project.status)} text-xs mt-1`}>
                      {formatStatus(project.status)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => e.preventDefault()}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              {/* Description */}
              <p className="text-slate-500 text-sm mt-4 line-clamp-2">
                {project.description || 'No description provided'}
              </p>

              {/* Progress Bar */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-500 font-medium">Progress</span>
                  <span className="font-bold text-slate-700">{project.progress || 0}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${project.progress || 0}%`,
                      backgroundColor: project.color || '#556b2f'
                    }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">
                    {project.dueDate
                      ? new Date(project.dueDate).toLocaleDateString()
                      : 'No deadline'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">{(project.members?.length || 0) + 1}</span>
                </div>
              </div>

              {/* Task Stats */}
              {project.taskStats && (
                <div className="flex items-center gap-4 mt-3 text-xs">
                  <span className="text-slate-500 font-medium">{project.taskStats.total || 0} tasks</span>
                  <span className="text-success-600 font-semibold">{project.taskStats.completed || 0} done</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No projects found</h3>
          <p className="text-slate-500 mt-2">
            {searchQuery || statusFilter
              ? 'Try adjusting your filters'
              : 'Create your first project to get started'}
          </p>
          {!searchQuery && !statusFilter && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary mt-6"
            >
              <Plus className="w-5 h-5" />
              Create Project
            </button>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Create New Project</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateProject} className="p-6 space-y-5">
              {/* Project Name */}
              <div>
                <label className="label">Project Name *</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter project name"
                  className="input"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="label">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the project"
                  className="input resize-none"
                  rows={3}
                />
              </div>

              {/* Priority */}
              <div>
                <label className="label">Priority</label>
                <select
                  value={newProject.priority}
                  onChange={(e) => setNewProject(prev => ({ ...prev, priority: e.target.value }))}
                  className="input"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="label">Due Date</label>
                <input
                  type="date"
                  value={newProject.dueDate}
                  onChange={(e) => setNewProject(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="input"
                />
              </div>

              {/* Color */}
              <div>
                <label className="label">Project Color</label>
                <div className="flex gap-3 mt-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewProject(prev => ({ ...prev, color }))}
                      className={`w-9 h-9 rounded-xl transition-all duration-200 ${
                        newProject.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary flex-1"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
