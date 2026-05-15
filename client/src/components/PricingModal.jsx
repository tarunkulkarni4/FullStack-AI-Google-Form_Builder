import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X, Check, Sparkles, Crown, Zap, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const FEATURES = [
    'Expand any form with AI',
    'Context-aware suggestions',
    'Unlimited question generation',
    'Preview & select questions',
    'Required / optional field control',
    'Multi-language support',
    'Priority AI processing',
];

const MONTHLY_MODELS = [
    { id: 'grok',     name: 'Grok',     icon: '⚡', color: '#FF6B35', free: true },
    { id: 'gemini',   name: 'Gemini',   icon: '✦', color: '#4285F4', free: true },
    { id: 'mistral',  name: 'Mistral',  icon: '▲', color: '#7C3AED', free: true },
    { id: 'deepseek', name: 'DeepSeek', icon: '◈', color: '#0EA5E9', free: true },
];

const YEARLY_MODELS = [
    { id: 'grok',    name: 'Grok',    icon: '⚡', color: '#FF6B35' },
    { id: 'gemini',  name: 'Gemini',  icon: '✦', color: '#4285F4' },
    { id: 'mistral', name: 'Mistral', icon: '▲', color: '#7C3AED' },
    { id: 'deepseek',name: 'DeepSeek',icon: '◈', color: '#0EA5E9' },
    { id: 'claude',  name: 'Claude',  icon: '◆', color: '#D97706' },
    { id: 'gpt4o',   name: 'GPT-4o',  icon: '◎', color: '#10A37F' },
];

/* Bar Spinner */
const BarSpinner = () => (
    <span className="inline-flex items-end gap-[2px]" style={{ height: 14 }}>
        <style>{`@keyframes bs{0%,100%{opacity:.25;transform:scaleY(.4)}50%{opacity:1;transform:scaleY(1)}}`}</style>
        {[0,1,2,3,4].map(i => (
            <span key={i} style={{
                display:'inline-block', width:2, height:14,
                borderRadius:2, backgroundColor:'currentColor',
                animation:`bs .9s ease-in-out ${i*.12}s infinite`,
                transformOrigin:'bottom'
            }} />
        ))}
    </span>
);

const PricingModal = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(null);
    const [searchParams] = useSearchParams();

    if (!isOpen) return null;

    const handleSubscribe = async (plan) => {
        setLoading(plan);
        try {
            const formId = searchParams.get('formId');
            const formTitle = searchParams.get('formTitle');
            
            const { data } = await api.post('/subscription/create-checkout', { 
                plan,
                formId,
                formTitle
            });
            window.location.href = data.url;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to start checkout');
            setLoading(null);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 font-sans"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-[760px] border border-slate-200/60 overflow-y-auto max-h-[90vh] md:max-h-[85vh]"
                style={{ animation: 'modal-in .2s cubic-bezier(.16,1,.3,1)' }}
                onClick={e => e.stopPropagation()}
            >
                <style>{`
                    @keyframes modal-in {
                        from { opacity: 0; transform: translateY(10px) scale(.98); }
                        to   { opacity: 1; transform: translateY(0) scale(1); }
                    }
                `}</style>

                {/* Header */}
                <div className="px-8 pt-8 pb-6 border-b border-slate-100">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">NexForm Pro</span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
                        Unlock AI Form Expansion
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">
                        Choose a plan to start expanding your forms with context-aware AI.
                    </p>
                </div>

                {/* Plans grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 md:p-6 bg-slate-50/50">

                    {/* Monthly */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                        <div className="mb-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center">
                                    <Zap className="w-3.5 h-3.5 text-slate-600" />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Monthly</span>
                            </div>

                            <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-[32px] font-black text-slate-900 tracking-tight">₹199</span>
                                <span className="text-sm text-slate-400 font-medium mb-1">/ month</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium">Billed monthly. Cancel anytime.</p>
                        </div>

                        {/* AI Models */}
                        <div className="mb-5">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">AI Models Included</p>
                            <div className="flex flex-wrap gap-1.5">
                                {MONTHLY_MODELS.map(m => (
                                    <span key={m.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
                                        <span style={{ color: m.color }}>{m.icon}</span>{m.name}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <ul className="space-y-2.5 mb-6 flex-1">
                            {FEATURES.map((f, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check className="w-2.5 h-2.5 text-slate-400" strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[12px] text-slate-600 font-medium leading-snug">{f}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleSubscribe('monthly')}
                            disabled={!!loading}
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl text-[12px] font-semibold hover:bg-slate-700 transition-all shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading === 'monthly' ? <><BarSpinner /> Starting…</> : 'Subscribe Monthly'}
                        </button>
                    </div>

                    {/* Yearly — dark premium card */}
                    <div className="bg-slate-900 rounded-xl border border-slate-700/50 p-6 flex flex-col shadow-xl shadow-indigo-900/20 hover:shadow-2xl hover:shadow-indigo-900/40 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden ring-1 ring-white/10">
                        {/* Dot grid texture */}
                        <div className="absolute inset-0 opacity-[0.04]" style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
                            backgroundSize: '20px 20px'
                        }} />

                        {/* Save badge */}
                        <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                            Save 25%
                        </div>

                        <div className="relative z-10 flex flex-col flex-1">
                            <div className="mb-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-6 h-6 rounded-md bg-white/10 border border-white/10 flex items-center justify-center">
                                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Yearly</span>
                                </div>

                                <div className="flex items-baseline gap-1 mb-1">
                                    <span className="text-[32px] font-black text-white tracking-tight">₹1,799</span>
                                    <span className="text-sm text-slate-400 font-medium mb-1">/ year</span>
                                </div>
                                <p className="text-[11px] font-medium">
                                    <span className="text-slate-400">Just </span>
                                    <span className="text-slate-200 font-bold">₹150/mo </span>
                                    <span className="text-slate-400">— best value</span>
                                </p>
                            </div>

                            {/* AI Models */}
                            <div className="mb-5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">AI Models Included</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {YEARLY_MODELS.map(m => (
                                        <span key={m.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-white/10 bg-white/10 text-[11px] font-semibold text-slate-200">
                                            <span style={{ color: m.color }}>{m.icon}</span>{m.name}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Includes Claude &amp; GPT-4o — exclusive to yearly.</p>
                            </div>

                            <ul className="space-y-2.5 mb-6 flex-1">
                                {FEATURES.map((f, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <div className="w-4 h-4 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check className="w-2.5 h-2.5 text-emerald-400" strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[12px] text-slate-300 font-medium leading-snug">{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSubscribe('yearly')}
                                disabled={!!loading}
                                className="w-full flex items-center justify-center gap-2 bg-white text-slate-900 py-3 rounded-xl text-[12px] font-semibold hover:bg-slate-100 transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {loading === 'yearly'
                                    ? <><BarSpinner /> Starting…</>
                                    : <><Crown className="w-3.5 h-3.5 text-amber-500" /> Subscribe Yearly — Best Value</>
                                }
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 md:px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3.5 text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-medium">Secured by Stripe</span>
                        </div>
                        <span className="text-slate-200 hidden sm:inline">·</span>
                        <span className="text-[11px] font-medium">Cancel anytime</span>
                        <span className="text-slate-200 hidden sm:inline">·</span>
                        <span className="text-[11px] font-medium">No hidden fees</span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">All prices in INR (₹)</span>
                </div>
            </div>
        </div>
    );
};

export default PricingModal;
