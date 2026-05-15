import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, RefreshCw, Wand2, ChevronDown, Check, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SUGGESTED_PROMPTS = [
    "Event registration form with diet preferences and plus ones.",
    "Employee onboarding checklist and equipment request.",
    "Post-webinar feedback survey with rating scales.",
    "Customer support intake form with issue categorization."
];

const LANGUAGES = [
    "English", "Spanish", "French", "German", "Hindi", 
    "Arabic", "Japanese", "Chinese (Simplified)", "Portuguese", 
    "Russian", "Italian", "Korean", "Dutch"
];

const AI_MODELS = [
    { id: 'grok',    name: 'Grok 1.5',         provider: 'xAI' },
    { id: 'gemini',  name: 'Gemini 1.5 Pro',   provider: 'Google' },
    { id: 'deepseek',name: 'DeepSeek Coder',   provider: 'DeepSeek' },
    { id: 'mistral', name: 'Mistral Large',    provider: 'Mistral', locked: true },
    { id: 'claude',  name: 'Claude 3.5 Sonnet',provider: 'Anthropic', locked: true },
    { id: 'gpt4o',   name: 'GPT-4o',           provider: 'OpenAI', locked: true },
];

const AIWizard = ({ isOpen, onClose, onSuccess, initialPrompt = '', autoStart = false }) => {
    const { user } = useAuth();
    const isPremium = user?.subscription?.plan === 'monthly' || user?.subscription?.plan === 'yearly' || user?.subscription?.status === 'active';

    const [step, setStep] = useState(1);
    const [prompt, setPrompt] = useState('');
    const [loadingStatus, setLoadingStatus] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPrompt(initialPrompt);
            setStep(1);
            
            if (initialPrompt && autoStart) {
                const autoGenerate = async () => {
                    setLoading(true);
                    try {
                        // Use English as default for templates
                        const { data } = await api.post('/forms/generate-ai', { prompt: initialPrompt, language: 'English', aiModel: selectedModel });
                        setSections(data);
                        setSelectedSections(data.map(s => s.id));
                        setStep(2);
                    } catch (error) {
                        toast.error('Failed to process template. Try again.');
                    } finally {
                        setLoading(false);
                    }
                };
                autoGenerate();
            }
        }
    }, [isOpen, initialPrompt, autoStart]);
    const [language, setLanguage] = useState('English');
    const [selectedModel, setSelectedModel] = useState('grok');
    const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
    const [themeColor, setThemeColor] = useState('#673ab7'); // Google Forms Purple
    const [loading, setLoading] = useState(false);
    
    // Step 2 state
    const [sections, setSections] = useState([]);
    const [selectedSections, setSelectedSections] = useState([]);
    
    // Step 3 state
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [responseLimit, setResponseLimit] = useState('');
    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    
    // Final state
    const [googleFormUrl, setGoogleFormUrl] = useState('');

    if (!isOpen) return null;

    const handleAnalyzeIntent = async () => {
        if (!prompt.trim()) {
            toast.error('Please describe what you want to build');
            return;
        }

        setLoading(true);
        const m = AI_MODELS.find(x => x.id === selectedModel);
        const modelName = m ? m.name.split(' ')[0] : 'AI';
        
        setLoadingStatus(`${modelName} loading...`);
        const timer = setTimeout(() => {
            setLoadingStatus(`${modelName} analyzing...`);
        }, 1000);

        try {
            const { data } = await api.post('/forms/generate-ai', { prompt, language, aiModel: selectedModel });
            setSections(data);
            setSelectedSections(data.map(s => s.id)); // Auto-select all by default
            setStep(2);
        } catch (error) {
            toast.error('Failed to analyze prompt. Try again.');
        } finally {
            clearTimeout(timer);
            setLoading(false);
            setLoadingStatus('');
        }
    };

    const handleGenerateStructure = async () => {
        if (selectedSections.length === 0) {
            toast.error('Please select at least one section');
            return;
        }

        setLoading(true);
        const m = AI_MODELS.find(x => x.id === selectedModel);
        const modelName = m ? m.name.split(' ')[0] : 'AI';
        
        setLoadingStatus(`${modelName} loading...`);
        const timer = setTimeout(() => {
            setLoadingStatus(`${modelName} generating...`);
        }, 1000);

        try {
            const chosenSections = sections.filter(s => selectedSections.includes(s.id));
            const { data } = await api.post('/forms/generate-structure', { 
                prompt, 
                sections: chosenSections,
                language,
                aiModel: selectedModel
            });
            
            setGeneratedQuestions(data.questions);
            // Google Forms API doesn't support custom theme colors, default to Google Purple
            setThemeColor('#673ab7');
            setFormTitle(prompt.split('.')[0].substring(0, 50)); // Default title from prompt
            setStep(3);
        } catch (error) {
            const msg = error.response?.data?.message || error.message || 'Failed to generate questions. Try again.';
            toast.error(msg);
        } finally {
            clearTimeout(timer);
            setLoading(false);
            setLoadingStatus('');
        }
    };

    const handleCreateGoogleForm = async () => {
        setLoading(true);
        try {
            const config = {
                prompt,
                sections,
                startDate: startDate || null,
                expiryDate: expiryDate || null,
                responseLimit: responseLimit ? parseInt(responseLimit) : 0,
            };

            const { data } = await api.post('/forms/create', {
                title: formTitle || 'AI Generated Form',
                description: formDescription,
                questions: generatedQuestions,
                config,
                themeColor
            });

            setGoogleFormUrl(data.publicUrl);
            setStep(4);
            
            // Notify parent component
            if (onSuccess) onSuccess(data);
            
            toast.success('Google Form created successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create Google Form');
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (id) => {
        setSelectedSections(prev => 
            prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
        );
    };

    const toggleQuestionRequired = (index) => {
        const newQuestions = [...generatedQuestions];
        const currentStatus = newQuestions[index].required !== undefined ? newQuestions[index].required : true;
        newQuestions[index].required = !currentStatus;
        setGeneratedQuestions(newQuestions);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in font-sans">
            <div className="bg-white border border-slate-200/60 rounded-2xl shadow-2xl w-full max-w-[800px] max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
                
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-7 h-7 bg-blue-50 border border-blue-100 rounded-lg text-blue-500 shadow-sm">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 leading-tight">Architecture Setup</h2>
                            {(() => { const m = AI_MODELS.find(x => x.id === selectedModel); return m ? (
                                <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                                    <Wand2 className="w-3 h-3" />
                                    {m.name} · {m.provider}
                                </p>
                            ) : null; })()}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Segmented Pill Indicator */}
                        <div className="flex items-center gap-1.5">
                            {[1, 2, 3].map((s) => (
                                <div 
                                    key={s} 
                                    className={`h-1.5 rounded-full transition-all duration-500 ${
                                        step >= s ? 'w-6 bg-slate-800' : 'w-2 bg-slate-200'
                                    }`}
                                />
                            ))}
                        </div>
                        <div className="h-4 w-px bg-slate-200"></div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg transition-colors border border-slate-200/50">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>



                {/* Content Area */}
                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 text-slate-700">
                    
                    {/* Step 1: Prompt */}
                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in max-w-[600px] mx-auto pt-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide flex justify-between items-center">
                                    <span>Describe your requirements</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="E.g., I need a customer feedback form for my new coffee shop. Ask about coffee quality, ambiance, and how they found out about us."
                                        className="relative input-field h-36 resize-none text-sm leading-relaxed border-slate-200/80 shadow-sm focus:border-blue-500 bg-white pb-10"
                                        autoFocus
                                    />
                                    
                                    {/* Model selector inside textarea */}
                                    <div className="absolute bottom-2 right-2 z-20 flex justify-end">
                                        {(() => {
                                            const m = AI_MODELS.find(x => x.id === selectedModel);
                                            return (
                                                <button
                                                    type="button"
                                                    onClick={() => setModelDropdownOpen(o => !o)}
                                                    className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-100 text-xs font-medium text-slate-600 transition-colors"
                                                >
                                                    <Wand2 className="w-3.5 h-3.5" />
                                                    <span>{m?.name}</span>
                                                    <ChevronDown className={`w-3 h-3 text-slate-400 ml-0.5 opacity-70 transition-transform duration-150 ${modelDropdownOpen ? 'rotate-180' : ''}`} />
                                                </button>
                                            );
                                        })()}

                                        {modelDropdownOpen && (
                                            <>
                                                <div className="fixed inset-0 z-50" onClick={() => setModelDropdownOpen(false)}></div>
                                                <div className="absolute bottom-full right-0 mb-1 z-[60] w-56 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden py-1 animate-fade-in origin-bottom-right">
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
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Suggestions */}
                                <div className="mt-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Suggestions</p>
                                    <div className="flex flex-wrap gap-2">
                                        {SUGGESTED_PROMPTS.map((suggestion, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setPrompt(suggestion)}
                                                className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200/80 px-2.5 py-1.5 rounded-md transition-all hover:border-blue-300 hover:text-blue-600 hover:shadow-sm active:scale-[0.98] text-left"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                    Target Language
                                </label>
                                <select 
                                    value={language} 
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="input-field w-full md:w-1/2 cursor-pointer bg-white border-slate-200/80 shadow-sm font-medium"
                                >
                                    {LANGUAGES.map((lang) => (
                                        <option key={lang} value={lang}>{lang}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3.5 flex gap-3 text-xs text-blue-700 shadow-sm">
                                <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />
                                <p className="leading-relaxed font-medium">Be descriptive. The LLM engine will automatically compute optimal field structures, validation, and semantic logic.</p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Sections */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="border-b border-slate-200 pb-4 mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
                                <div>
                                    <h3 className="text-base font-bold text-slate-800 mb-1">Generated Schema</h3>
                                    <p className="text-xs text-slate-500 font-medium">Select the modular sections to include in the deployment.</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        if (selectedSections.length === sections.length) {
                                            setSelectedSections([]);
                                        } else {
                                            setSelectedSections(sections.map(s => s.id));
                                        }
                                    }}
                                    className="text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-200/60 shadow-sm whitespace-nowrap active:scale-[0.98]"
                                >
                                    {selectedSections.length === sections.length && sections.length > 0 ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {sections.map((section) => (
                                    <div 
                                        key={section.id}
                                        onClick={() => toggleSection(section.id)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                                            selectedSections.includes(section.id) 
                                                ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500/10' 
                                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="text-sm font-bold text-slate-800">{section.title}</h4>
                                            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                                                selectedSections.includes(section.id)
                                                    ? 'bg-blue-500 border-blue-500'
                                                    : 'border-slate-300 bg-slate-50'
                                            }`}>
                                                {selectedSections.includes(section.id) && <X className="w-2.5 h-2.5 text-white rotate-45" />}
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-medium">
                                            {section.description}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {section.suggestedFields?.map((field, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-slate-100 border border-slate-200/60 text-slate-600 text-[9px] rounded uppercase font-bold tracking-wide">
                                                    {field}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Final Details & Review */}
                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[400px]">
                                {/* Left Col: Details */}
                                <div className="space-y-6 border-r border-slate-200 pr-8 h-full overflow-y-auto">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Configuration</h3>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Form Title</label>
                                                <input 
                                                    type="text" 
                                                    value={formTitle}
                                                    onChange={e => setFormTitle(e.target.value)}
                                                    className="input-field bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
                                                <textarea 
                                                    value={formDescription}
                                                    onChange={e => setFormDescription(e.target.value)}
                                                    className="input-field h-20 resize-none text-xs bg-white"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Start Date</label>
                                                    <input 
                                                        type="date" 
                                                        value={startDate}
                                                        onChange={e => setStartDate(e.target.value)}
                                                        min={new Date().toISOString().split('T')[0]}
                                                        className="input-field text-xs bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Expiry Date</label>
                                                    <input 
                                                        type="date" 
                                                        value={expiryDate}
                                                        onChange={e => setExpiryDate(e.target.value)}
                                                        min={startDate || new Date().toISOString().split('T')[0]}
                                                        className="input-field text-xs bg-white"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Response Limit</label>
                                                <input 
                                                    type="number" 
                                                    value={responseLimit}
                                                    onChange={e => setResponseLimit(e.target.value)}
                                                    placeholder="Unlimited"
                                                    min="1"
                                                    className="input-field text-xs bg-white"
                                                />
                                            </div>
                                            
                                            

                                        </div>
                                    </div>
                                </div>

                                {/* Right Col: Preview */}
                                <div className="h-full flex flex-col pl-2">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 w-full flex justify-between">
                                            <span>Schema Preview</span>
                                            <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{generatedQuestions.length} Fields</span>
                                        </h3>
                                    </div>
                                    
                                    <div className="bg-white border border-slate-200 rounded-xl p-5 flex-1 overflow-y-auto shadow-inner">
                                        <div className="h-1.5 w-12 rounded-full mb-4 opacity-80" style={{ backgroundColor: themeColor }}></div>
                                        <h4 className="font-bold text-sm mb-1 text-slate-800">{formTitle || 'Form Title'}</h4>
                                        <p className="text-[11px] text-slate-500 mb-6 font-medium">{formDescription || 'Form description goes here...'}</p>
                                        
                                        <div className="space-y-4">
                                            {generatedQuestions.map((q, i) => {
                                                const isRequired = q.required !== undefined ? q.required : true;
                                                return (
                                                    <div key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-200/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300 group">
                                                        <div className="flex justify-between items-start mb-2.5">
                                                            <p className="font-semibold text-xs text-slate-800 pr-4">
                                                                <span className="text-slate-400 mr-2">{i+1}.</span>
                                                                {q.title} {isRequired && <span className="text-rose-500 font-bold">*</span>}
                                                            </p>
                                                            
                                                            {/* Mandatory Toggle */}
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                                    Required
                                                                </span>
                                                                <button
                                                                    onClick={() => toggleQuestionRequired(i)}
                                                                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${isRequired ? 'bg-blue-500' : 'bg-slate-300'}`}
                                                                >
                                                                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-sm ${isRequired ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Fake inputs based on type */}
                                                        {q.type === 'short_answer' && <div className="border-b border-slate-300 w-1/2 pb-1.5 text-[10px] text-slate-400 font-medium">Short answer text</div>}
                                                        {q.type === 'paragraph' && <div className="border-b border-slate-300 w-full pb-1.5 text-[10px] text-slate-400 font-medium">Paragraph answer text</div>}
                                                        {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
                                                            <div className="space-y-2 mt-3">
                                                                {q.options?.map((opt, oIdx) => (
                                                                    <div key={oIdx} className="flex items-center gap-2.5">
                                                                        <div className={`w-3 h-3 border border-slate-300 ${q.type === 'multiple_choice' ? 'rounded-full' : 'rounded-sm bg-white'}`}></div>
                                                                        <span className="text-xs text-slate-600 font-medium">{opt}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {q.type === 'scale' && (
                                                            <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium mt-3">
                                                                <div className="flex gap-1.5">
                                                                    {[1,2,3,4,5].map(n => <div key={n} className="w-5 h-5 rounded-full border border-slate-200 bg-white flex items-center justify-center shadow-sm font-bold text-slate-600">{n}</div>)}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Step 4: Success */}
                    {step === 4 && (
                        <div className="flex flex-col items-center justify-center py-10 animate-fade-in text-center">
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100 shadow-sm">
                                <Sparkles className="w-6 h-6 text-emerald-500" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2 text-slate-900">Deployment Successful</h2>
                            <p className="text-slate-500 text-sm mb-8 font-medium max-w-[320px] mx-auto">Your architecture has been translated and pushed to Google Forms API.</p>
                            
                            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center gap-3 w-full max-w-sm mb-8 shadow-sm">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Endpoint</span>
                                <div className="w-full relative flex items-center">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={googleFormUrl}
                                        className="w-full p-2.5 pr-20 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none shadow-inner"
                                    />
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(googleFormUrl);
                                            toast.success('Copied to clipboard');
                                        }}
                                        className="absolute right-1 text-[10px] font-bold bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md transition-colors border border-slate-200 shadow-sm"
                                    >
                                        Copy URL
                                    </button>
                                </div>
                            </div>
                            
                            <button onClick={onClose} className="btn-secondary px-8">
                                Return to Workspace
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer / Actions */}
                {step < 4 && (
                    <div className="px-5 py-4 border-t border-slate-200 bg-white flex justify-between items-center rounded-b-2xl">
                        {step > 1 ? (
                            <button 
                                onClick={() => setStep(step - 1)} 
                                disabled={loading}
                                className="btn-ghost"
                            >
                                Back
                            </button>
                        ) : (
                            <div></div>
                        )}
                        
                        <button
                            onClick={() => {
                                if (step === 1) handleAnalyzeIntent();
                                else if (step === 2) handleGenerateStructure();
                                else if (step === 3) handleCreateGoogleForm();
                            }}
                            disabled={loading || (step === 1 && !prompt.trim()) || (step === 2 && selectedSections.length === 0)}
                            className="btn-primary"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    {loadingStatus || (step === 1 ? 'Analyzing...' : step === 2 ? 'Generating...' : 'Creating Google Form...')}
                                </>
                            ) : (
                                <>
                                    {step === 1 ? 'Analyze Intent' : step === 2 ? 'Generate Form' : 'Deploy to Google Forms'}
                                    <Sparkles className="w-4 h-4 ml-1" />
                                </>
                            )}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AIWizard;
