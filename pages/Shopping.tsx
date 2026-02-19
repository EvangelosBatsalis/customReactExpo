
import React, { useEffect, useState } from 'react';
import { useFamily } from '../App';
import { supabaseService } from '../services/supabaseService';
import { ShoppingList, ShoppingItem } from '../types';
import { Plus, Trash2, CheckCircle, Circle, ShoppingCart } from 'lucide-react';

export const Shopping: React.FC = () => {
    const { activeFamily } = useFamily();
    const [lists, setLists] = useState<ShoppingList[]>([]);
    const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Form States
    const [newListName, setNewListName] = useState('');
    const [newItemName, setNewItemName] = useState('');

    useEffect(() => {
        if (activeFamily) {
            loadLists();
        }
    }, [activeFamily]);

    useEffect(() => {
        if (selectedList) {
            loadItems(selectedList.id);
        } else {
            setItems([]);
        }
    }, [selectedList]);

    const loadLists = async () => {
        try {
            const data = await supabaseService.getShoppingLists(activeFamily!.id);
            setLists(data);
            if (data.length > 0 && !selectedList) {
                setSelectedList(data[0]);
            }
        } catch (err) {
            console.error('Error loading lists', err);
        }
    };

    const loadItems = async (listId: string) => {
        try {
            const data = await supabaseService.getShoppingItems(listId);
            setItems(data);
        } catch (err) {
            console.error('Error loading items', err);
        }
    };

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName.trim() || !activeFamily) return;
        try {
            const newList = await supabaseService.createShoppingList(activeFamily.id, newListName);
            setLists([newList, ...lists]);
            setSelectedList(newList);
            setNewListName('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim() || !selectedList) return;
        try {
            const newItem = await supabaseService.addShoppingItem(selectedList.id, newItemName);
            setItems([...items, newItem]);
            setNewItemName('');
        } catch (err) {
            console.error(err);
        }
    };

    const toggleItem = async (item: ShoppingItem) => {
        try {
            // Optimistic update
            const updatedItems = items.map(i => i.id === item.id ? { ...i, isDone: !i.isDone } : i);
            setItems(updatedItems);
            await supabaseService.toggleShoppingItem(item.id, !item.isDone);
        } catch (err) {
            console.error(err);
            loadItems(selectedList!.id); // revert on error
        }
    };

    const deleteItem = async (itemId: string) => {
        try {
            setItems(items.filter(i => i.id !== itemId));
            await supabaseService.deleteShoppingItem(itemId);
        } catch (err) {
            console.error(err);
        }
    };

    const deleteList = async (listId: string) => {
        if (!confirm('Are you sure? This will delete all items in the list.')) return;
        try {
            await supabaseService.deleteShoppingList(listId);
            const updatedLists = lists.filter(l => l.id !== listId);
            setLists(updatedLists);
            if (selectedList?.id === listId) {
                setSelectedList(updatedLists[0] || null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex gap-6">
            {/* Sidebar with Lists */}
            <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-bold text-slate-700 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-indigo-600" />
                        Your Lists
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {lists.map(list => (
                        <div
                            key={list.id}
                            onClick={() => setSelectedList(list)}
                            className={`p-3 rounded-xl cursor-pointer flex items-center justify-between group transition-colors ${selectedList?.id === list.id ? 'bg-indigo-50 text-indigo-900 font-medium' : 'hover:bg-slate-50 text-slate-600'
                                }`}
                        >
                            <span className="truncate">{list.name}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); deleteList(list.id); }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded text-slate-400 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleCreateList} className="p-4 border-t border-slate-100">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="New list..."
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                        <button
                            type="submit"
                            disabled={!newListName.trim()}
                            className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>

            {/* Main Items Area */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                {!selectedList ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
                        <p>Select or create a shopping list</p>
                    </div>
                ) : (
                    <>
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-slate-800">{selectedList.name}</h2>
                            <span className="text-sm font-medium text-slate-400">{items.filter(i => !i.isDone).length} remaining</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-2">
                            {items.map(item => (
                                <div
                                    key={item.id}
                                    className={`flex items-center group p-3 rounded-xl border transition-all ${item.isDone
                                            ? 'bg-slate-50 border-transparent'
                                            : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-sm'
                                        }`}
                                >
                                    <button
                                        onClick={() => toggleItem(item)}
                                        className={`mr-4 transition-colors ${item.isDone ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-500'}`}
                                    >
                                        {item.isDone ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                    </button>

                                    <span className={`flex-1 font-medium text-lg transition-colors ${item.isDone ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-700'}`}>
                                        {item.title}
                                    </span>

                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            {items.length === 0 && (
                                <p className="text-center text-slate-400 py-10 italic">List is empty</p>
                            )}
                        </div>

                        <form onSubmit={handleAddItem} className="p-6 border-t border-slate-100 bg-slate-50">
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Add item..."
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!newItemName.trim()}
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200"
                                >
                                    Add
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};
