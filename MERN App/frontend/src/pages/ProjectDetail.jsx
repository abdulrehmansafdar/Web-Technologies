/**
 * ===========================================
 * Project Detail Page Component
 * ===========================================
 * 
 * Shows detailed project view with Kanban board for tasks.
 * Supports drag and drop for task status updates.
 * 
 * @module pages/ProjectDetail
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Loader2,
  Edit,
  Trash2,
  Users
} from 'lucide-react';

/**
 * ProjectDetail Component
 * 
 * Features:
 * - Project information header
 * - Kanban board with 4 columns
 * - Drag and drop task management
 * - Create and edit tasks
 */
const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState({
    'todo': [],
    'in-progress': [],
    'in-review': [],
    'completed': []
  });
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  // New task form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignee: '',
    dueDate: '',
    status: 'todo'
  });
  const [saving, setSaving] = useState(false);

  /**
   * Fetch project and tasks data
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, tasksRes, membersRes] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/tasks/project/${id}`),
          api.get('/users/team/members')
        ]);

        setProject(projectRes.data.data.project);
        setTasks(tasksRes.data.data.tasks);
        setTeamMembers(membersRes.data.data.members);
      } catch (error) {
        console.error('Failed to fetch project:', error);
        toast.error('Failed to load project');
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  /**
   * Handle drag end for task status update
   */
  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    // Get source and destination columns
    const sourceColumn = [...tasks[source.droppableId]];
    const destColumn = source.droppableId === destination.droppableId
      ? sourceColumn
      : [...tasks[destination.droppableId]];

    // Remove from source
    const [movedTask] = sourceColumn.splice(source.index, 1);

    // Add to destination
    destColumn.splice(destination.index, 0, movedTask);

    // Update state optimistically
    const newTasks = {
      ...tasks,
      [source.droppableId]: sourceColumn,
      [destination.droppableId]: destColumn
    };
    setTasks(newTasks);

    // Update on server
    try {
      await api.patch(`/tasks/${draggableId}/status`, {
        status: destination.droppableId,
        order: destination.index
      });
    } catch (error) {
      // Revert on error
      console.error('Failed to update task status:', error);
      toast.error('Failed to update task');
      // Refetch tasks
      const tasksRes = await api.get(`/tasks/project/${id}`);
      setTasks(tasksRes.data.data.tasks);
    }
  };

  /**
   * Handle create/edit task
   */
  const handleSaveTask = async (e) => {
    e.preventDefault();

    if (!taskForm.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    setSaving(true);

    try {
      if (editingTask) {
        // Update existing task
        const response = await api.put(`/tasks/${editingTask._id}`, taskForm);
        const updatedTask = response.data.data.task;

        // Update in state
        setTasks(prev => {
          const newTasks = { ...prev };
          // Remove from old status if changed
          Object.keys(newTasks).forEach(status => {
            newTasks[status] = newTasks[status].filter(t => t._id !== editingTask._id);
          });
          // Add to new status
          newTasks[updatedTask.status] = [...newTasks[updatedTask.status], updatedTask];
          return newTasks;
        });

        toast.success('Task updated successfully');
      } else {
        // Create new task
        const response = await api.post('/tasks', {
          ...taskForm,
          project: id
        });
        const newTask = response.data.data.task;

        // Add to state
        setTasks(prev => ({
          ...prev,
          [newTask.status]: [...prev[newTask.status], newTask]
        }));

        toast.success('Task created successfully');
      }

      // Reset form
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        assignee: '',
        dueDate: '',
        status: 'todo'
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle edit task click
   */
  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assignee: task.assignee?._id || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      status: task.status
    });
    setShowTaskModal(true);
  };

  /**
   * Handle delete task
   */
  const handleDeleteTask = async (taskId, status) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await api.delete(`/tasks/${taskId}`);
      
      setTasks(prev => ({
        ...prev,
        [status]: prev[status].filter(t => t._id !== taskId)
      }));

      toast.success('Task deleted successfully');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  /**
   * Get priority badge color
   */
  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      critical: 'bg-red-100 text-red-600'
    };
    return styles[priority] || styles.medium;
  };

  /**
   * Column configuration
   */
  const columns = [
    { id: 'todo', title: 'To Do', icon: Clock, color: 'gray' },
    { id: 'in-progress', title: 'In Progress', icon: AlertTriangle, color: 'blue' },
    { id: 'in-review', title: 'In Review', icon: User, color: 'yellow' },
    { id: 'completed', title: 'Completed', icon: CheckCircle2, color: 'green' }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/projects"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: project?.color }}
              />
              <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
            </div>
            <p className="text-gray-600 mt-1">{project?.description || 'No description'}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingTask(null);
            setTaskForm({
              title: '',
              description: '',
              priority: 'medium',
              assignee: '',
              dueDate: '',
              status: 'todo'
            });
            setShowTaskModal(true);
          }}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add Task
        </button>
      </div>

      {/* Project Stats */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>
            Due: {project?.dueDate
              ? new Date(project.dueDate).toLocaleDateString()
              : 'Not set'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{(project?.members?.length || 0) + 1} members</span>
        </div>
        <div className={`badge ${
          project?.status === 'completed' ? 'badge-success' :
          project?.status === 'in-progress' ? 'badge-primary' :
          'badge-gray'
        }`}>
          {project?.status?.replace('-', ' ')}
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((column) => (
            <div
              key={column.id}
              className="bg-gray-50 rounded-xl p-4"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <column.icon className={`w-5 h-5 text-${column.color}-500`} />
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                    {tasks[column.id]?.length || 0}
                  </span>
                </div>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-[200px] transition-colors rounded-lg p-2 ${
                      snapshot.isDraggingOver ? 'bg-gray-100' : ''
                    }`}
                  >
                    {tasks[column.id]?.map((task, index) => (
                      <Draggable
                        key={task._id}
                        draggableId={task._id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            {/* Task Header */}
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-gray-900 text-sm">
                                {task.title}
                              </h4>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task._id, column.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Description */}
                            {task.description && (
                              <p className="text-gray-500 text-xs mt-2 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            {/* Task Footer */}
                            <div className="flex items-center justify-between mt-3">
                              <span className={`badge text-xs ${getPriorityBadge(task.priority)}`}>
                                {task.priority}
                              </span>
                              <div className="flex items-center gap-2">
                                {task.dueDate && (
                                  <span className="text-xs text-gray-400">
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                                {task.assignee && (
                                  <div
                                    className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-medium"
                                    title={task.assignee.name}
                                  >
                                    {task.assignee.name?.charAt(0)}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Subtask Progress */}
                            {task.subtasks?.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span>Subtasks</span>
                                  <span>
                                    {task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length}
                                  </span>
                                </div>
                                <div className="h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                  <div
                                    className="h-full bg-green-500 rounded-full"
                                    style={{
                                      width: `${(task.subtasks.filter(s => s.isCompleted).length / task.subtasks.length) * 100}%`
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setEditingTask(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-6 space-y-4">
              <div>
                <label className="label">Task Title *</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Task description"
                  className="input resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="input"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="label">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, status: e.target.value }))}
                    className="input"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="in-review">In Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Assignee</label>
                <select
                  value={taskForm.assignee}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, assignee: e.target.value }))}
                  className="input"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Due Date</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="input"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTaskModal(false);
                    setEditingTask(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : editingTask ? (
                    'Update Task'
                  ) : (
                    'Create Task'
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

export default ProjectDetail;
