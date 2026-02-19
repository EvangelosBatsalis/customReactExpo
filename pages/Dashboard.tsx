
import React, { useEffect, useState } from 'react';
import { useFamily } from '../App';
import { mockDb } from '../services/mockDb';
import { Task, CalendarEvent, TaskStatus } from '../types';
import { format, isSameDay, parseISO } from 'date-fns';
import { CheckCircle2, Circle, Clock, ArrowRight, ListTodo, Calendar as CalendarIcon, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { activeFamily } = useFamily();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    if (activeFamily) {
      setTasks(mockDb.getTasks(activeFamily.id));
      setEvents(mockDb.getEvents(activeFamily.id));
      setMembers(mockDb.getFamilyMembers(activeFamily.id));
    }
  }, [activeFamily]);

  const today = new Date();
  const todayTasks = tasks.filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), today));
  const todayEvents = events.filter(e => isSameDay(parseISO(e.startAt), today));
  const completedTasksCount = tasks.filter(t => t.status === TaskStatus.DONE).length;

  const toggleTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updated = mockDb.upsertTask({
      ...task,
      status: task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE
    });
    setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <p className="text-slate-500 font-medium">Hello, here's what's happening today</p>
        <h1 className="text-3xl font-bold mt-1">Welcome back to {activeFamily?.name}</h1>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 text-indigo-600 mb-2">
            <ListTodo className="w-5 h-5" />
            <span className="font-semibold text-sm uppercase tracking-wider">Total Tasks</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold">{tasks.length}</span>
            <span className="text-slate-400 mb-1">active</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold text-sm uppercase tracking-wider">Completed</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold">{completedTasksCount}</span>
            <span className="text-slate-400 mb-1">total</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 text-amber-500 mb-2">
            <CalendarIcon className="w-5 h-5" />
            <span className="font-semibold text-sm uppercase tracking-wider">Today's Events</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold">{todayEvents.length}</span>
            <span className="text-slate-400 mb-1">scheduled</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 text-slate-600 mb-2">
            <Users className="w-5 h-5" />
            <span className="font-semibold text-sm uppercase tracking-wider">Family Size</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold">{members.length}</span>
            <span className="text-slate-400 mb-1">members</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Agenda */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Today's Timeline
              </h2>
              <span className="text-sm font-medium text-slate-500">{format(today, 'EEEE, MMM do')}</span>
            </div>

            <div className="space-y-4">
              {todayEvents.length === 0 && todayTasks.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-400">Quiet day! Nothing on the schedule.</p>
                </div>
              )}
              
              {/* Combine Events and Tasks for Today */}
              {todayEvents.map(event => (
                <div key={event.id} className="group flex gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 transition-all">
                   <div className="w-12 h-12 bg-amber-200 text-amber-800 rounded-xl flex flex-col items-center justify-center shrink-0">
                     <CalendarIcon className="w-5 h-5" />
                   </div>
                   <div className="flex-1">
                     <p className="font-bold text-amber-900">{event.title}</p>
                     <p className="text-sm text-amber-700">{format(parseISO(event.startAt), 'h:mm a')}</p>
                   </div>
                </div>
              ))}

              {todayTasks.map(task => (
                <div key={task.id} className="group flex gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all">
                  <button onClick={() => toggleTask(task.id)} className="shrink-0 mt-1">
                    {task.status === TaskStatus.DONE 
                      ? <CheckCircle2 className="w-6 h-6 text-indigo-600" /> 
                      : <Circle className="w-6 h-6 text-slate-300 group-hover:text-indigo-400" />
                    }
                  </button>
                  <div className="flex-1">
                    <p className={`font-semibold ${task.status === TaskStatus.DONE ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs font-medium text-slate-500 uppercase tracking-tight">
                      <span>{task.dueTime || 'All day'}</span>
                      {task.assignedTo && <span className="bg-slate-100 px-2 py-0.5 rounded">Assigned</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4">
              <Link to="/tasks" className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-3 px-4 rounded-xl text-center text-sm transition-colors">View All Tasks</Link>
              <Link to="/calendar" className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-3 px-4 rounded-xl text-center text-sm transition-colors">View Calendar</Link>
            </div>
          </div>
        </div>

        {/* Members Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold mb-6 flex items-center justify-between">
              Family Members
              <Link to="/members" className="text-xs text-indigo-600 hover:underline">Manage</Link>
            </h2>
            <div className="space-y-4">
              {members.map(member => (
                <div key={member.userId} className="flex items-center gap-3 p-2">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
                    {member.profile?.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{member.profile?.fullName}</p>
                    <p className="text-xs text-slate-500 capitalize">{member.role.toLowerCase()}</p>
                  </div>
                  <div className="ml-auto">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200"></div>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => window.location.hash = '#/members'}
              className="mt-8 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-medium hover:border-indigo-400 hover:text-indigo-600 transition-all group"
            >
              <PlusIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Invite Member
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlusIcon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
