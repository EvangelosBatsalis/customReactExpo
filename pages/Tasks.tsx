
import React, { useEffect, useState } from 'react';
import { useFamily, useAuth } from '../App';
import { mockDb } from '../services/mockDb';
import { Task, TaskStatus, UserProfile } from '../types';
import { Plus, CheckCircle2, Circle, Clock, Filter, Search, User, Calendar as CalIcon, Pencil, Trash2, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const Tasks: React.FC = () => {
  const { activeFamily } = useFamily();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [members, setMembers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (activeFamily) {
      setTasks(mockDb.getTasks(activeFamily.id));
      const familyMembers = mockDb.getFamilyMembers(activeFamily.id);
      setMembers(familyMembers.map(m => m.profile).filter((p): p is UserProfile => p !== undefined));
    }
  }, [activeFamily]);

  const filteredTasks = tasks.filter(t => {
    const matchesFilter = filter === 'ALL' || t.status === filter;
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const resetModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setNewTaskTitle('');
    setDueDate('');
    setAssignedTo('');
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setDueDate(task.dueDate || '');
    setAssignedTo(task.assignedTo || '');
    setIsModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !activeFamily || !user) return;
    const taskData: any = {
      familyId: activeFamily.id,
      title: newTaskTitle,
      dueDate: dueDate || undefined,
      assignedTo: assignedTo || undefined,
      createdBy: editingTask ? editingTask.createdBy : user.id,
      status: editingTask ? editingTask.status : TaskStatus.TODO
    };
    if (editingTask) {
      taskData.id = editingTask.id;
    }
    const savedTask = mockDb.upsertTask(taskData);
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? savedTask : t));
    } else {
      setTasks([savedTask, ...tasks]);
    }
    resetModal();
  };

  const handleStatusChange = (id: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === id);
    if (!task || !activeFamily || !user) return;

    let newAssignedTo = task.assignedTo;
    if (newStatus === TaskStatus.DOING) {
      newAssignedTo = user.id;
    }

    const updated = mockDb.upsertTask({
      ...task,
      status: newStatus,
      assignedTo: newAssignedTo,
      familyId: activeFamily.id,
      createdBy: task.createdBy
    });
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
  };

  const handleDeleteTask = (id: string) => {
    if (!activeFamily) return;
    mockDb.deleteTask(id, activeFamily.id);
    setTasks(prev => prev.filter(t => t.id !== id));
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
      <div className="grid grid-cols-1 gap-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400">No tasks found. Try adjusting your filters.</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all">
              <button onClick={() => {
                const nextStatus = task.status === TaskStatus.TODO ? TaskStatus.DOING :
                  task.status === TaskStatus.DOING ? TaskStatus.DONE : TaskStatus.TODO;
                handleStatusChange(task.id, nextStatus);
              }} className="shrink-0">
                {task.status === TaskStatus.DONE ? <CheckCircle2 className="w-7 h-7 text-indigo-600" /> :
                  task.status === TaskStatus.DOING ? <ArrowRight className="w-7 h-7 text-amber-500" /> :
                    <Circle className="w-7 h-7 text-slate-300 group-hover:text-indigo-400" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-lg truncate ${task.status === TaskStatus.DONE ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                  {task.title}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-1">
                  {task.dueDate && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-tight">
                      <CalIcon className="w-3.5 h-3.5" />
                      {format(parseISO(task.dueDate), 'MMM do, yyyy')}
                    </div>
                  )}
                  {task.assignedTo && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 uppercase tracking-tight">
                      <User className="w-3.5 h-3.5" />
                      {members.find(m => m.id === task.assignedTo)?.fullName || 'Assigned'}
                    </div>
                  )}
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <span className={`px-3 py-1 mr-2 rounded-full text-[10px] font-black uppercase tracking-widest ${task.status === TaskStatus.DONE ? 'bg-indigo-50 text-indigo-600' :
                    task.status === TaskStatus.DOING ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                  {task.status}
                </span>
                <button onClick={() => openEditModal(task)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit/Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-6">{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
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
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                  >
                    {editingTask ? 'Save Changes' : 'Add Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
