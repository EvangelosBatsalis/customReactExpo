import React, { useEffect, useState } from 'react';
import { useFamily, useAuth } from '../App';
import { supabaseService } from '../services/supabaseService';
import { Task, TaskStatus, UserProfile } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { Plus, CheckCircle2, Circle, Clock, Filter, Search, User, Calendar as CalIcon, Pencil, Trash2, ArrowRight, CornerDownRight, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { format, parseISO, isPast, isToday } from 'date-fns';

export const Tasks: React.FC = () => {
  const { activeFamily } = useFamily();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');

  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Confirm Modal States
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDanger: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isDanger: false,
    onConfirm: () => { }
  });

  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  const [members, setMembers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (activeFamily) {
        try {
          const [fetchedTasks, fetchedMembers] = await Promise.all([
            supabaseService.getTasks(activeFamily.id),
            supabaseService.getFamilyMembers(activeFamily.id)
          ]);
          setTasks(fetchedTasks);
          setMembers(fetchedMembers.map(m => m.profile).filter((p): p is UserProfile => p !== null && p !== undefined));
        } catch (error) {
          console.error("Error fetching tasks:", error);
        }
      }
    };
    fetchTasks();
  }, [activeFamily]);

  const filteredTasks = tasks.filter(t => {
    const matchesFilter = filter === 'ALL' || t.status === filter;

    // Check if the task itself matches the search
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());

    // Check if any of its subtasks match the search
    const hasMatchingSubtask = tasks.some(sub =>
      sub.parentId === t.id && sub.title.toLowerCase().includes(search.toLowerCase())
    );

    return matchesFilter && (matchesSearch || hasMatchingSubtask);
  });

  const parentTasks = filteredTasks.filter(t => !t.parentId);
  const getSubTasks = (parentId: string) => tasks.filter(t => t.parentId === parentId);

  // Next Up logic: Nearest due date that is not done
  const pendingTasksWithDates = tasks.filter(t => t.status !== TaskStatus.DONE && t.dueDate);
  const nextUpTask = pendingTasksWithDates.length > 0
    ? [...pendingTasksWithDates].sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0]
    : null;

  const resetModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setNewTaskTitle('');
    setDueDate('');
    setAssignedTo('');
    setSelectedParentId('');
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setDueDate(task.dueDate || '');
    setAssignedTo(task.assignedTo || '');
    setSelectedParentId(task.parentId || '');
    setIsModalOpen(true);
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const performSaveTask = async (taskData: any) => {
    try {
      const savedTask = await supabaseService.upsertTask(taskData);
      if (editingTask) {
        setTasks(prev => prev.map(t => t.id === editingTask.id ? savedTask : t));
      } else {
        setTasks([savedTask, ...tasks]);
      }
      resetModal();
    } catch (err) {
      console.error("Error saving task", err);
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !activeFamily || !user) return;

    const taskData: any = {
      familyId: activeFamily.id,
      title: newTaskTitle,
      dueDate: dueDate || undefined,
      assignedTo: assignedTo || undefined,
      parentId: selectedParentId || undefined,
      createdBy: editingTask ? editingTask.createdBy : user.id,
      status: editingTask ? editingTask.status : TaskStatus.TODO
    };
    if (editingTask) {
      taskData.id = editingTask.id;
    }

    if (editingTask && editingTask.title !== newTaskTitle) {
      setConfirmModal({
        isOpen: true,
        title: 'Rename Task',
        message: `Are you sure you want to rename "${editingTask.title}" to "${newTaskTitle}"?`,
        isDanger: false,
        onConfirm: () => {
          performSaveTask(taskData);
          closeConfirmModal();
        }
      });
      return;
    }

    performSaveTask(taskData);
  };

  const performStatusChange = async (id: string, newStatus: TaskStatus, newAssignedTo: string | undefined, originalTask: Task) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus, assignedTo: newAssignedTo } : t));
    try {
      const updated = await supabaseService.upsertTask({
        ...originalTask,
        status: newStatus,
        assignedTo: newAssignedTo,
      });
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    } catch (error) {
      console.error("Failed to update status", error);
      setTasks(prev => prev.map(t => t.id === id ? originalTask : t));
    }
  };

  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === id);
    if (!task || !activeFamily || !user) return;

    let newAssignedTo = task.assignedTo;
    if (newStatus === TaskStatus.DOING && !task.assignedTo) {
      newAssignedTo = user.id;
    }

    if (task.status === TaskStatus.DONE && newStatus === TaskStatus.TODO) {
      setConfirmModal({
        isOpen: true,
        title: 'Reset Task',
        message: `Are you sure you want to reset "${task.title}"? It is already marked as DONE.`,
        isDanger: false,
        onConfirm: () => {
          performStatusChange(id, newStatus, newAssignedTo, task);
          closeConfirmModal();
        }
      });
      return;
    }

    performStatusChange(id, newStatus, newAssignedTo, task);
  };

  const executeDeleteTask = async (id: string) => {
    const previousTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== id && t.parentId !== id));
    try {
      await supabaseService.deleteTask(id);
    } catch (err) {
      console.error("Error deleting task:", err);
      setTasks(previousTasks);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!activeFamily) return;

    setConfirmModal({
      isOpen: true,
      title: 'Delete Task',
      message: "Are you sure you want to delete this task? This action cannot be undone.",
      isDanger: true,
      onConfirm: () => {
        executeDeleteTask(id);
        closeConfirmModal();
      }
    });
  };

  // Render a single task row
  const renderTask = (task: Task, isSubtask: boolean = false) => {
    const isNextUp = nextUpTask?.id === task.id;
    const overdue = task.dueDate && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate)) && task.status !== TaskStatus.DONE;

    const subTasks = getSubTasks(task.id);
    const hasSubtasks = !isSubtask && subTasks.length > 0;
    const isExpanded = expandedTasks.has(task.id);

    return (
      <div key={task.id} className={`group flex flex-col sm:flex-row sm:items-center gap-4 p-4 md:p-5 bg-white rounded-2xl border ${isNextUp && !isSubtask ? 'border-amber-300 ring-2 ring-amber-50 shadow-md' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'} transition-all`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isSubtask && <CornerDownRight className="w-5 h-5 ml-8 text-slate-300 shrink-0" />}

          {!isSubtask && hasSubtasks ? (
            <button onClick={(e) => toggleExpand(task.id, e)} className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors shrink-0">
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          ) : !isSubtask ? (
            <div className="w-7 shrink-0" />
          ) : null}

          <button onClick={() => {
            const nextStatus = task.status === TaskStatus.TODO ? TaskStatus.DOING :
              task.status === TaskStatus.DOING ? TaskStatus.DONE : TaskStatus.TODO;
            handleStatusChange(task.id, nextStatus);
          }} className="shrink-0 mt-0.5 sm:mt-0">
            {task.status === TaskStatus.DONE ? <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-indigo-600" /> :
              task.status === TaskStatus.DOING ? <ArrowRight className="w-6 h-6 md:w-7 md:h-7 text-amber-500" /> :
                <Circle className="w-6 h-6 md:w-7 md:h-7 text-slate-300 group-hover:text-indigo-400" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`font-bold text-base md:text-lg truncate ${task.status === TaskStatus.DONE ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                {task.title}
              </p>
              {isNextUp && !isSubtask && task.status !== TaskStatus.DONE && (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Next Up
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              {task.dueDate && (
                <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-tight ${overdue ? 'text-red-500' : 'text-slate-500'}`}>
                  <CalIcon className="w-3.5 h-3.5" />
                  {format(parseISO(task.dueDate), 'MMM do, yyyy')}
                  {overdue && <span className="text-[10px] bg-red-100 px-1.5 rounded text-red-700 ml-1">Overdue</span>}
                </div>
              )}
              <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-tight ${task.assignedTo ? 'text-indigo-500' : 'text-slate-400'}`}>
                <User className="w-3.5 h-3.5" />
                {task.assignedTo ? (task.assigneeName || members.find(m => m.id === task.assignedTo)?.fullName) : 'Everyone'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 ml-10 sm:ml-0 border-t sm:border-t-0 pt-3 sm:pt-0 mt-3 sm:mt-0 border-slate-100">
          <span className={`hidden md:inline-flex px-3 py-1 mr-2 rounded-full text-[10px] font-black uppercase tracking-widest ${task.status === TaskStatus.DONE ? 'bg-indigo-50 text-indigo-600' :
            task.status === TaskStatus.DOING ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
            }`}>
            {task.status}
          </span>
          <button onClick={() => openEditModal(task)} className="p-2 md:p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors" title="Edit Task">
            <Pencil className="w-4 h-4 md:w-4 md:h-4" />
          </button>
          {!isSubtask && (
            <button onClick={() => {
              resetModal();
              setSelectedParentId(task.id);
              setIsModalOpen(true);
            }} className="p-2 md:p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors" title="Add Subtask">
              <Plus className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => handleDeleteTask(task.id)} className="p-2 md:p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors" title="Delete Task">
            <Trash2 className="w-4 h-4 md:w-4 md:h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-slate-500">Manage daily chores and household errands.</p>
        </div>
        <button
          onClick={() => { resetModal(); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add New Task
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['ALL', TaskStatus.TODO, TaskStatus.DOING, TaskStatus.DONE] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 gap-4">
        {parentTasks.length === 0 && search === '' && filter === 'ALL' ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400">No tasks found. Time to add something!</p>
          </div>
        ) : parentTasks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400">No matching tasks found.</p>
          </div>
        ) : (
          parentTasks.map(task => (
            <div key={task.id} className="space-y-2">
              {renderTask(task)}

              {/* Render Subtasks */}
              {expandedTasks.has(task.id) && getSubTasks(task.id).length > 0 && (
                <div className="flex flex-col gap-2">
                  {getSubTasks(task.id).map(subTask => renderTask(subTask, true))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Edit/Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto">
            <div className="p-6 sm:p-8 space-y-6">
              <h2 className="text-2xl font-bold">{editingTask ? 'Edit Task' : selectedParentId ? 'Add Sub-task' : 'Create New Task'}</h2>

              {selectedParentId && (
                <div className="p-3 bg-indigo-50 text-indigo-800 text-sm rounded-xl font-medium flex items-center gap-2">
                  <CornerDownRight className="w-4 h-4" />
                  Under: {tasks.find(t => t.id === selectedParentId)?.title}
                </div>
              )}

              <form onSubmit={handleSaveTask} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="e.g. Clean the kitchen"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Assign To</label>
                  <select
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="">Everyone (Whole Family)</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.fullName}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 sm:gap-4 pt-4">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center"
                  >
                    {editingTask ? 'Save Changes' : 'Save Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        isDanger={confirmModal.isDanger}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />
    </div>
  );
};
