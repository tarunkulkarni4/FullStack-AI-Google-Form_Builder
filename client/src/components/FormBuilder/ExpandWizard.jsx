import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, CheckCircle, X, ChevronRight, ChevronDown, Check, Lock, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Russian', 'Chinese', 'Japanese', 'Korean', 'Hindi', 'Arabic'];

const AI_MODELS = [
    { id: 'grok',    name: 'Grok 1.5',         provider: 'xAI' },
    { id: 'gemini',  name: 'Gemini 1.5 Pro',   provider: 'Google' },
    { id: 'deepseek',name: 'DeepSeek Coder',   provider: 'DeepSeek' },
    { id: 'mistral', name: 'Mistral Large',    provider: 'Mistral', locked: true },
    { id: 'claude',  name: 'Claude 3.5 Sonnet',provider: 'Anthropic', locked: true },
    { id: 'gpt4o',   name: 'GPT-4o',           provider: 'OpenAI', locked: true },
];

/* Bar spinner — 5 vertical bars fading in sequence */
const BarSpinner = ({ className = 'w-4 h-4' }) => (
    <span className={`inline-flex items-end gap-[2px] ${className}`}>
        <style>{`
            @keyframes bar-fade {
                0%, 100% { opacity: 0.2; transform: scaleY(0.5); }
                50%       { opacity: 1;   transform: scaleY(1);   }
            }
        `}</style>
        {[0,1,2,3,4].map(i => (
            <span
                key={i}
                style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '14px',
                    borderRadius: '2px',
                    backgroundColor: 'currentColor',
                    animation: `bar-fade 0.9s ease-in-out ${i * 0.12}s infinite`,
                    transformOrigin: 'bottom',
                }}
            />
        ))}
    </span>
);

const ExpandWizard = ({ isOpen, onClose, formId, formTitle, onSuccess }) => {
    const { user } = useAuth();
    const isPremium = user?.subscription?.plan === 'monthly' || user?.subscription?.plan === 'yearly' || user?.subscription?.status === 'active';

    const [prompt, setPrompt] = useState('');
    const [language, setLanguage] = useState('English');
    const [selectedModel, setSelectedModel] = useState('grok');
    const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
    const modelDropdownRef = useRef(null);

    const [generating, setGenerating] = useState(false);
    const [applying, setApplying] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [previewQuestions, setPreviewQuestions] = useState([]);
    const [selectedIndexes, setSelectedIndexes] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    const allSelected = selectedIndexes.length === previewQuestions.length && previewQuestions.length > 0;

    const toggleSelect = (i) =>
        setSelectedIndexes(prev =>
            prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
        );

    const selectAll = () => setSelectedIndexes(previewQuestions.map((_, i) => i));
    const deselectAll = () => setSelectedIndexes([]);

    // Fetch AI suggestions when wizard opens or model changes
    useEffect(() => {
        if (!isOpen || !formId) return;
        setSuggestions([]);
        setLoadingSuggestions(true);
        api.get(`/forms/${formId}/expand/suggestions?aiModel=${selectedModel}`)
            .then(({ data }) => setSuggestions(data.suggestions || []))
            .catch(() => setSuggestions([]))
            .finally(() => setLoadingSuggestions(false));
    }, [isOpen, formId, selectedModel]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
                setModelDropdownOpen(false);
            }
        };
        if (modelDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [modelDropdownOpen]);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!prompt.trim()) return toast.error('Please describe what to add');
        setGenerating(true);
        const m = AI_MODELS.find(x => x.id === selectedModel);
        const modelName = m ? m.name.split(' ')[0] : 'AI';
        
        setLoadingStatus(`${modelName} loading...`);
        const timer = setTimeout(() => {
            setLoadingStatus(`${modelName} analyzing...`);
        }, 1000);

        try {
            const { data } = await api.post(`/forms/${formId}/expand/generate`, { prompt, language, aiModel: selectedModel });
            const qs = data.questions.map(q => ({ ...q, required: true }));
            setPreviewQuestions(qs);
            setSelectedIndexes(qs.map((_, i) => i)); // select all by default
            toast.success(`${data.questions.length} questions generated!`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate questions');
        } finally {
            clearTimeout(timer);
            setGenerating(false);
            setLoadingStatus('');
        }
    };

    const handleApply = async () => {
        const questionsToApply = previewQuestions.filter((_, i) => selectedIndexes.includes(i));
        if (questionsToApply.length === 0) return toast.error('Select at least one question to append');
        setApplying(true);
        try {
            await api.post(`/forms/${formId}/expand/apply`, { questions: questionsToApply });
            toast.success('Form expanded successfully!');
            onSuccess?.();
            handleClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to apply questions');
        } finally {
            setApplying(false);
        }
    };

    const toggleRequired = (index) => {
        setPreviewQuestions(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], required: !updated[index].required };
            return updated;
        });
    };

    const handleClose = () => {
        setPrompt('');
        setPreviewQuestions([]);
        setSelectedIndexes([]);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in font-sans">
            <div className="bg-white border border-slate-200/60 rounded-2xl shadow-2xl w-full max-w-[860px] max-h-[88vh] flex flex-col overflow-hidden animate-slide-up">

                {/* ── Header ── */}
                <div className="px-7 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.15em]">Expand with AI</h2>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium pl-6 truncate max-w-xs" title={formTitle}>
                            {formTitle}
                        </p>
                    </div>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Two-column body ── */}
                <div className="flex flex-1 overflow-hidden min-h-0">

                    {/* Left: Config */}
                    <div className="w-[340px] shrink-0 border-r border-slate-100 flex flex-col bg-slate-50/50">

                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
                            {/* Prompt */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Describe What to Add</label>
                                <div className="relative group">
                                    <textarea
                                        value={prompt}
                                        onChange={e => setPrompt(e.target.value)}
                                        placeholder="e.g. Add feedback questions about catering quality..."
                                        rows={5}
                                        className="w-full px-4 py-3 pb-10 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 resize-none placeholder:text-slate-400 transition-all"
                                    />
                                    {/* Model selector — pinned bottom-right inside textarea, exactly like VS Code */}
                                    <div className="absolute bottom-2 right-2 z-20 flex justify-end" ref={modelDropdownRef}>
                                        {(() => {
                                            const m = AI_MODELS.find(x => x.id === selectedModel);
                                            return (
                                                <button
                                                    type="button"
                                                    onClick={() => setModelDropdownOpen(o => !o)}
                                                    className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-100 text-xs font-medium text-slate-600 transition-colors bg-white/90 backdrop-blur-sm shadow-sm border border-slate-200"
                                                >
                                                    <Wand2 className="w-3.5 h-3.5" />
                                                    <span>{m?.name}</span>
                                                    <ChevronDown className={`w-3 h-3 text-slate-400 ml-0.5 opacity-70 transition-transform duration-150 ${modelDropdownOpen ? 'rotate-180' : ''}`} />
                                                </button>
                                            );
                                        })()}

                                        {/* Dropdown panel — opens downward to avoid clipping */}
                                        {modelDropdownOpen && (
                                            <div className="absolute top-full right-0 mt-1 z-[60] w-56 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden py-1 animate-slide-up origin-top-right">
                                                {AI_MODELS.map((m) => (
                                                    <button
                                                        key={m.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const isLocked = m.locked && !isPremium;
                                                            if (isLocked) {
                                                                toast('Upgrade to Premium to unlock ' + m.name, { icon: '🔒' });
                                                                return;
                                                            }
                                                            setSelectedModel(m.id);
                                                            setModelDropdownOpen(false);
                                                        }}
                                                        className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-xs transition-colors ${
                                                            (m.locked && !isPremium) ? 'text-slate-400 hover:bg-slate-50' :
                                                            selectedModel === m.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100 text-slate-700'
                                                        }`}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            {m.name}
                                                            {(m.locked && !isPremium) && <Lock className="w-3 h-3 opacity-60" />}
                                                        </span>
                                                        {selectedModel === m.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Suggestions */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Suggestions</label>
                                <div className="flex flex-col gap-1.5">
                                    {loadingSuggestions ? (
                                        [1,2,3,4].map(i => (
                                            <div key={i} className="h-8 bg-slate-200/60 rounded-lg animate-pulse" />
                                        ))
                                    ) : suggestions.length > 0 ? (
                                        suggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setPrompt(s)}
                                                className="text-left text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200/60 hover:border-slate-300 px-3 py-2 rounded-lg transition-all flex items-center gap-2 group"
                                            >
                                                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0" />
                                                {s}
                                            </button>
                                        ))
                                    ) : (
                                        <p className="text-[11px] text-slate-400 italic">No suggestions available.</p>
                                    )}
                                </div>
                            </div>

                            {/* Language */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Language</label>
                                <select
                                    value={language}
                                    onChange={e => setLanguage(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                                >
                                    {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Generate Button — always pinned at bottom */}
                        <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                            <button
                                onClick={handleGenerate}
                                disabled={generating || !prompt.trim()}
                                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-lg text-[11px] font-medium uppercase tracking-[0.12em] hover:bg-slate-700 transition-all shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {generating ? <BarSpinner className="w-5 h-4" /> : <Sparkles className="w-4 h-4" />}
                                {generating ? (loadingStatus || 'Generating...') : 'Generate Preview'}
                            </button>
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 shrink-0 flex items-center justify-between bg-white">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Schema Preview</h3>
                            {previewQuestions.length > 0 && (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={allSelected ? deselectAll : selectAll}
                                        className="text-[10px] font-medium text-slate-500 hover:text-slate-800 underline underline-offset-2 transition-colors"
                                    >
                                        {allSelected ? 'Deselect All' : 'Select All'}
                                    </button>
                                    <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2.5 py-1 rounded border border-slate-200">
                                        {selectedIndexes.length}/{previewQuestions.length} Selected
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {generating ? (
                                /* Skeleton loaders while AI generates */
                                <div className="space-y-3">
                                    {[1, 2, 3, 4].map(n => (
                                        <div key={n} className="bg-white border border-slate-200/70 rounded-xl p-4 shadow-sm animate-pulse">
                                            <div className="flex items-start gap-2.5 mb-4">
                                                <div className="mt-0.5 w-3.5 h-3.5 rounded bg-slate-200 shrink-0" />
                                                <div className="flex-1 space-y-2">
                                                    <div className={`h-3 bg-slate-200 rounded ${n % 2 === 0 ? 'w-3/4' : 'w-5/6'}`} />
                                                    <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="w-6 h-2.5 bg-slate-100 rounded" />
                                                    <div className="w-7 h-4 bg-slate-200 rounded-full" />
                                                </div>
                                            </div>
                                            <div className={`h-2 bg-slate-100 rounded ${n % 3 === 0 ? 'w-full' : 'w-2/3'} border-b border-slate-200 pb-1`} />
                                            <div className="mt-3 h-2 bg-slate-50 rounded w-16" />
                                        </div>
                                    ))}
                                </div>
                            ) : previewQuestions.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
                                        <Sparkles className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700 mb-1">No preview yet</p>
                                    <p className="text-xs text-slate-400 max-w-[220px] font-medium">Describe what you want to add and click Generate Preview.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {previewQuestions.map((q, i) => {
                                        const isRequired = q.required !== undefined ? q.required : true;
                                        const isSelected = selectedIndexes.includes(i);
                                        return (
                                            <div
                                                key={i}
                                                className={`bg-white border rounded-xl p-4 shadow-sm transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'border-slate-800 ring-1 ring-slate-800/20'
                                                        : 'border-slate-200/70 opacity-50 hover:opacity-75'
                                                }`}
                                                onClick={() => toggleSelect(i)}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-start gap-2.5">
                                                        {/* Checkbox */}
                                                        <div className={`mt-0.5 w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center transition-colors ${
                                                            isSelected ? 'bg-slate-800 border-slate-800' : 'border-slate-300 bg-white'
                                                        }`}>
                                                            {isSelected && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-800 leading-snug">
                                                            <span className="text-slate-400 font-medium mr-1">{i + 1}.</span>
                                                            {q.title}
                                                            {isRequired && <span className="text-rose-500 ml-1">*</span>}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Req.</span>
                                                        <button
                                                            onClick={() => toggleRequired(i)}
                                                            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${isRequired ? 'bg-slate-800' : 'bg-slate-200'}`}
                                                        >
                                                            <span className={`inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${isRequired ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Type-based preview */}
                                                {q.type === 'short_answer' && (
                                                    <div className="border-b border-slate-200 w-2/3 pb-1 text-[10px] text-slate-400">Short answer</div>
                                                )}
                                                {q.type === 'paragraph' && (
                                                    <div className="border-b border-slate-200 w-full pb-1 text-[10px] text-slate-400">Paragraph</div>
                                                )}
                                                {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
                                                    <div className="space-y-1.5">
                                                        {q.options?.slice(0, 3).map((opt, oi) => (
                                                            <div key={oi} className="flex items-center gap-2">
                                                                <div className={`w-3 h-3 border border-slate-300 shrink-0 ${q.type === 'multiple_choice' ? 'rounded-full' : 'rounded-sm'}`} />
                                                                <span className="text-[11px] text-slate-600 font-medium">{opt}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {q.type === 'scale' && (
                                                    <div className="flex gap-1.5 mt-1">
                                                        {[1,2,3,4,5].map(n => (
                                                            <div key={n} className="w-6 h-6 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm">{n}</div>
                                                        ))}
                                                    </div>
                                                )}
                                                <span className="inline-block mt-2 text-[9px] font-bold text-slate-300 uppercase tracking-wider">{q.type?.replace('_', ' ')}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="px-7 py-4 border-t border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <button onClick={handleClose} className="text-xs font-medium text-slate-500 hover:text-slate-800 uppercase tracking-widest transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={applying || previewQuestions.length === 0}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-lg text-[11px] font-medium uppercase tracking-[0.12em] hover:bg-slate-700 transition-all shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {applying ? <BarSpinner className="w-5 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        {applying ? 'Applying...' : `Append to Form`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExpandWizard;
