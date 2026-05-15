import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw, Trash2, Edit3, Settings, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const EditWizard = ({ isOpen, onClose, formId, formTitle }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [items, setItems] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingTitle, setEditingTitle] = useState('');

    useEffect(() => {
        if (isOpen && formId) {
            fetchStructure();
        }
    }, [isOpen, formId]);

    const fetchStructure = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/forms/${formId}/structure`);
            // Add metadata to items
            const parsedItems = (data.items || []).map((item, index) => ({
                ...item,
                originalIndex: index,
                originalTitle: item.title || '',
                isDeleted: false,
            }));
            setItems(parsedItems);
        } catch (error) {
            toast.error('Failed to load form structure');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        const requests = [];

        // 1. Process title updates first (while indices are unchanged)
        items.forEach(item => {
            if (!item.isDeleted && item.title !== item.originalTitle) {
                // Strip metadata fields that are not part of Google API
                const { originalIndex, originalTitle, isDeleted, ...googleItem } = item;
                
                requests.push({
                    updateItem: {
                        item: googleItem,
                        location: { index: originalIndex },
                        updateMask: 'title'
                    }
                });
            }
        });

        // 2. Process deletions in descending order of originalIndex!
        const deletions = items
            .filter(i => i.isDeleted)
            .sort((a, b) => b.originalIndex - a.originalIndex);

        deletions.forEach(item => {
            requests.push({
                deleteItem: {
                    location: { index: item.originalIndex }
                }
            });
        });

        if (requests.length === 0) {
            toast('No changes made', { icon: 'ℹ️' });
            onClose();
            return;
        }

        setSaving(true);
        try {
            await api.put(`/forms/${formId}/structure`, { requests });
            toast.success('Form updated successfully!');
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update form');
        } finally {
            setSaving(false);
        }
    };

    const toggleDelete = (index) => {
        const newItems = [...items];
        newItems[index].isDeleted = !newItems[index].isDeleted;
        setItems(newItems);
    };

    const startEdit = (index, currentTitle) => {
        setEditingIndex(index);
        setEditingTitle(currentTitle);
    };

    const saveEdit = (index) => {
        const newItems = [...items];
        newItems[index].title = editingTitle;
        setItems(newItems);
        setEditingIndex(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in font-sans">
            <div className="bg-white border border-slate-200/60 rounded-2xl shadow-2xl w-full max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
                
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-7 h-7 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 shadow-sm">
                            <Settings className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 leading-tight">Edit Form Structure</h2>
                            <p className="text-[10px] font-semibold text-slate-500 truncate max-w-[300px]">
                                {formTitle}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg transition-colors border border-slate-200/50">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 text-slate-700">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <RefreshCw className="w-6 h-6 animate-spin text-slate-400 mb-3" />
                            <p className="text-sm font-medium text-slate-500">Fetching structure from Google Forms...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-20 text-slate-500">
                            No editable items found in this form.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="mb-4">
                                <p className="text-xs font-medium text-slate-500">
                                    You can turn off (delete) sections or rename fields. Changes will be synced directly to your live Google Form.
                                </p>
                            </div>
                            
                            {items.map((item, i) => (
                                <div 
                                    key={item.itemId} 
                                    className={`bg-white p-4 rounded-xl border shadow-sm transition-all flex items-start gap-3 ${
                                        item.isDeleted ? 'opacity-50 border-rose-200 bg-rose-50/30' : 'border-slate-200/60 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="mt-0.5 text-slate-400 text-xs font-bold w-4">{i + 1}.</div>
                                    
                                    <div className="flex-1">
                                        {editingIndex === i ? (
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="text" 
                                                    value={editingTitle}
                                                    onChange={(e) => setEditingTitle(e.target.value)}
                                                    className="input-field py-1 px-2 text-xs w-full bg-white border-slate-300 focus:ring-blue-500"
                                                    autoFocus
                                                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                                />
                                                <button onClick={() => saveEdit(i)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors border border-emerald-200 shadow-sm shrink-0">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => setEditingIndex(null)} className="p-1.5 bg-slate-50 text-slate-500 rounded hover:bg-slate-100 transition-colors border border-slate-200 shadow-sm shrink-0">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <p className={`font-semibold text-xs ${item.isDeleted ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                                                {item.title || 'Untitled Item'}
                                            </p>
                                        )}
                                        
                                        {!item.isDeleted && !editingIndex && item.questionItem?.question && (
                                            <span className="inline-block mt-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                {item.questionItem.question.textQuestion ? 'Text Input' : 
                                                 item.questionItem.question.choiceQuestion ? 'Multiple Choice' : 
                                                 item.questionItem.question.scaleQuestion ? 'Scale' : 'Question'}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Controls */}
                                    {editingIndex !== i && (
                                        <div className="flex items-center gap-2 shrink-0">
                                            {!item.isDeleted && (
                                                <button 
                                                    onClick={() => startEdit(i, item.title)}
                                                    className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                    title="Edit title"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => toggleDelete(i)}
                                                className={`p-1.5 rounded-lg transition-colors border ${
                                                    item.isDeleted 
                                                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200' 
                                                    : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600 border-transparent hover:border-rose-100'
                                                }`}
                                                title={item.isDeleted ? "Restore item" : "Remove item"}
                                            >
                                                {item.isDeleted ? <RefreshCw className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-slate-200 bg-white flex justify-end items-center rounded-b-2xl shrink-0">
                    <div className="flex gap-3">
                        <button onClick={onClose} className="btn-ghost text-xs">
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave} 
                            disabled={loading || saving}
                            className="btn-primary"
                        >
                            {saving ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditWizard;
