
import React, { useEffect, useState } from 'react';
import { useFamily, useAuth } from '../App';
import { supabaseService } from '../services/supabaseService';
import { CalendarEvent as EventType } from '../types';
import { Plus, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';

export const Calendar: React.FC = () => {
    const { activeFamily } = useFamily();
    const { user } = useAuth();
    const [events, setEvents] = useState<EventType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form
    const [title, setTitle] = useState('');
    const [startAt, setStartAt] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (activeFamily) {
            loadEvents();
        }
    }, [activeFamily]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const data = await supabaseService.getEvents(activeFamily!.id);
            setEvents(data);
        } catch (err) {
            console.error('Failed to load events', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !startAt || !activeFamily || !user) return;

        try {
            await supabaseService.createEvent(activeFamily.id, {
                title,
                startAt: new Date(startAt).toISOString(),
                notes,
                createdBy: user.id
            });
            setShowAddModal(false);
            setTitle('');
            setStartAt('');
            setNotes('');
            loadEvents();
        } catch (err) {
            console.error(err);
        }
    };

    // Group events by upcoming
    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.startAt) >= now);
    const pastEvents = events.filter(e => new Date(e.startAt) < now);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Family Calendar</h1>
                    <p className="text-slate-500 mt-1">Upcoming events & obligations</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                    <Plus className="w-5 h-5" />
                    Add Event
                </button>
            </div>

            <div className="space-y-8">
                <div>
                    <h2 className="text-lg font-bold text-slate-700 mb-4 px-2">Upcoming</h2>
                    {upcomingEvents.length === 0 ? (
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 border-dashed text-center text-slate-400">
                            No upcoming events.
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {upcomingEvents.map(event => (
                                <div key={event.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-5 hover:border-indigo-200 transition-all">
                                    <div className="flex-shrink-0 w-16 text-center">
                                        <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                                            {format(parseISO(event.startAt), 'MMM')}
                                        </div>
                                        <div className="text-2xl font-bold text-slate-900 leading-none">
                                            {format(parseISO(event.startAt), 'd')}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            {format(parseISO(event.startAt), 'EEE')}
                                        </div>
                                    </div>
                                    <div className="flex-1 border-l border-slate-100 pl-5">
                                        <h3 className="font-bold text-lg text-slate-900">{event.title}</h3>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4" />
                                                {format(parseISO(event.startAt), 'h:mm a')}
                                            </span>
                                        </div>
                                        {event.notes && (
                                            <p className="mt-3 text-slate-600 text-sm bg-slate-50 p-3 rounded-lg inline-block">
                                                {event.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {pastEvents.length > 0 && (
                    <div className="opacity-60">
                        <h2 className="text-lg font-bold text-slate-700 mb-4 px-2">Past Events</h2>
                        <div className="grid gap-4">
                            {pastEvents.slice(0, 3).map(event => ( // Show only last 3
                                <div key={event.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                                    <div className="text-sm font-bold text-slate-500 w-24">
                                        {format(parseISO(event.startAt), 'MMM d, yyyy')}
                                    </div>
                                    <div className="font-medium text-slate-700">{event.title}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Add Event</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Event Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    placeholder="e.g. School Play"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Date & Time</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={startAt}
                                    onChange={e => setStartAt(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 min-h-[100px]"
                                    placeholder="Additional details..."
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-all"
                            >
                                Save Event
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
