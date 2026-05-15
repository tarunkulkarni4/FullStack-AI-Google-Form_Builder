import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    Command, LogOut, Plus, FileText, ExternalLink, 
    BarChart2, Loader2, Edit3, Trash2, Calendar, 
    Clock, Copy, QrCode, X, Sparkles, Crown, CreditCard, Shield, ChevronDown, LayoutTemplate,
    PenTool, Settings, Eye
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import api from '../services/api';
import AIWizard from '../components/FormBuilder/AIWizard';
import ExpandWizard from '../components/FormBuilder/ExpandWizard';
import EditWizard from '../components/FormBuilder/EditWizard';
import PricingModal from '../components/PricingModal';
import Footer from '../components/Layouts/Footer';

const DAILY_TEMPLATES = [
    { title: "Party RSVP", prompt: "Create a fun party RSVP form to collect guest names, dietary restrictions, and song requests." },
    { title: "Event Registration", prompt: "Create an event registration form collecting attendee details, session preferences, and contact info." },
    { title: "Customer Feedback", prompt: "Create a customer feedback survey to rate their experience, gather suggestions, and ask for a testimonial." },
    { title: "Contact Information", prompt: "Create a simple contact information form to collect names, phone numbers, emails, and physical addresses." },
    { title: "Job Application", prompt: "Create a basic job application form collecting applicant details, experience, education, and references." },
    { title: "Maintenance Request", prompt: "Create a maintenance request form to report issues, describe the problem, and set urgency level." }
];

const Dashboard = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user, logout } = useAuth();
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [wizardOpen, setWizardOpen] = useState(false);
    const [qrModalData, setQrModalData] = useState(null);
    const [expandModalData, setExpandModalData] = useState(null);
    const [editModalData, setEditModalData] = useState(null);
    const [pricingOpen, setPricingOpen] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [subChecking, setSubChecking] = useState(false);
    const [history, setHistory] = useState([]);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [templatesOpen, setTemplatesOpen] = useState(false);
    const [initialPrompt, setInitialPrompt] = useState('');
    const [autoStart, setAutoStart] = useState(false);

    const fetchForms = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/forms');
            setForms(data);
        } catch (error) {
            console.error('Failed to fetch forms:', error);
            toast.error('Failed to load forms');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubscription = async () => {
        try {
            const { data } = await api.get('/subscription/status');
            setSubscription(data);
            if (data.isActive) {
                const hist = await api.get('/subscription/history');
                setHistory(hist.data);
            }
        } catch {
            setSubscription({ isActive: false });
        }
    };

    const handleDebugReset = () => {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-fade-in' : 'animate-fade-out'} max-w-sm w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex flex-col border border-slate-200 overflow-hidden`}>
                <div className="p-5">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                            <Shield className="w-5 h-5 text-rose-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">Reset Subscription?</p>
                            <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">This will revert your account to the free tier immediately. This is a developer-only action.</p>
                        </div>
                    </div>
                </div>
                <div className="flex border-t border-slate-100 divide-x divide-slate-100">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-1 px-4 py-3 text-[10px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const loadingToast = toast.loading('Resetting plan...');
                            try {
                                await api.post('/subscription/debug-reset');
                                toast.success('Subscription reset to free', { id: loadingToast });
                                fetchSubscription();
                            } catch {
                                toast.error('Reset failed', { id: loadingToast });
                            }
                        }}
                        className="flex-1 px-4 py-3 text-[10px] font-bold text-rose-500 hover:bg-rose-50 transition-colors uppercase tracking-widest"
                    >
                        Confirm Reset
                    </button>
                </div>
            </div>
        ), { duration: 6000 });
    };

    // Show welcome toast for new Pro users
    useEffect(() => {
        const expandParam = searchParams.get('expand');
        if (expandParam === 'true' && subscription?.isActive) {
            toast.success(`Welcome to Pro, ${user?.name.split(' ')[0]}!`, {
                icon: '👑',
                duration: 5000,
                style: {
                    borderRadius: '12px',
                    background: '#0F172A',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }
            });
        }
    }, [subscription?.isActive, user?.name]);

    // Gate: check subscription then open wizard or pricing
    const handleExpandClick = async (form) => {
        if (subscription?.isActive) {
            setExpandModalData({ id: form._id, title: form.formTitle });
            return;
        }
        setSubChecking(true);
        try {
            const { data } = await api.get('/subscription/status');
            setSubscription(data);
            if (data.isActive) {
                setExpandModalData({ id: form._id, title: form.formTitle });
            } else {
                setSearchParams({ formId: form._id, formTitle: form.formTitle });
                setPricingOpen(true);
            }
        } catch {
            setPricingOpen(true);
        } finally {
            setSubChecking(false);
        }
    };

    useEffect(() => {
        fetchForms();
        fetchSubscription();
    }, []);

    useEffect(() => {
        const expandParam = searchParams.get('expand');
        if (expandParam === 'true' && subscription?.isActive) {
            const formId = searchParams.get('formId');
            const formTitle = searchParams.get('formTitle');
            if (formId) {
                setExpandModalData({ id: formId, title: formTitle || 'My Form' });
                setSearchParams({}, { replace: true });
            }
        }
    }, [searchParams, subscription, setSearchParams]);

    const handleDelete = async (id) => {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-fade-in' : 'animate-fade-out'} max-w-sm w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex flex-col border border-slate-200 overflow-hidden`}>
                <div className="p-5">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                            <Trash2 className="w-5 h-5 text-rose-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">Delete Form?</p>
                            <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">This action cannot be undone. All responses and metadata for this form will be permanently removed.</p>
                        </div>
                    </div>
                </div>
                <div className="flex border-t border-slate-100 divide-x divide-slate-100">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-1 px-4 py-3 text-[10px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const loadingToast = toast.loading('Deleting form...');
                            try {
                                await api.delete(`/forms/${id}`);
                                setForms(forms.filter(f => f._id !== id));
                                toast.success('Form deleted successfully', { id: loadingToast });
                            } catch (error) {
                                toast.error('Failed to delete form', { id: loadingToast });
                            }
                        }}
                        className="flex-1 px-4 py-3 text-[10px] font-bold text-rose-500 hover:bg-rose-50 transition-colors uppercase tracking-widest"
                    >
                        Confirm Delete
                    </button>
                </div>
            </div>
        ), { duration: 6000 });
    };

    const handleCopyLink = (url) => {
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900 font-sans selection:bg-blue-500/20">
            {/* Navbar */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 h-14 flex items-center">
                <div className="max-w-[1000px] mx-auto w-full px-6 flex items-center justify-between">
                    <div 
                        onClick={() => navigate('/dashboard')} 
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        <div className="flex items-center justify-center w-7 h-7 bg-white border border-slate-200/60 shadow-sm rounded-lg">
                            <Command className="h-4 w-4 text-slate-800" strokeWidth={2} />
                        </div>
                        <div className="font-semibold text-sm text-slate-900 tracking-tight">AI Form Builder</div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* DEBUG RESET BUTTON */}
                        <button 
                            onClick={handleDebugReset}
                            className="btn-danger !py-1 !px-3"
                        >
                            Reset Plan
                        </button>

                        {/* UPGRADE BUTTON FOR FREE USERS */}
                        {!subscription?.isActive && (
                            <button 
                                onClick={() => setPricingOpen(true)}
                                className="btn-primary !py-1 !px-3 !text-[10px] bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200/50"
                            >
                                <Sparkles className="w-3 h-3" />
                                Upgrade
                            </button>
                        )}

                        <div className="h-4 w-px bg-slate-200 mx-1"></div>

                        <div className="relative">
                            <div 
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition-colors"
                            >
                                {user?.profilePicture && (
                                    <img 
                                        src={user.profilePicture} 
                                        alt="Profile" 
                                        className="w-7 h-7 rounded-full border border-slate-200" 
                                        referrerPolicy="no-referrer"
                                    />
                                )}

                                <span className="text-xs font-semibold text-slate-700 hidden md:block">{user?.name}</span>
                                {subscription?.isActive && (
                                    <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                                        <Crown className="w-2.5 h-2.5" /> Pro {subscription.plan}
                                    </span>
                                )}
                            </div>

                            {/* USER DROPDOWN */}
                            {userMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)}></div>
                                    <div className="absolute right-0 mt-2 w-56 card !p-2 z-20 shadow-xl animate-fade-in origin-top-right">
                                        <div className="px-3 py-3 border-b border-slate-100 mb-1">
                                            <p className="text-xs font-black text-slate-900 truncate">{user?.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 truncate lowercase mt-0.5">{user?.email?.toLowerCase()}</p>
                                        </div>
                                        
                                        <button 
                                            onClick={() => { navigate('/payment-history'); setUserMenuOpen(false); }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[10px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all uppercase tracking-widest"
                                        >
                                            <CreditCard className="h-3.5 w-3.5" />
                                            Billing History
                                        </button>

                                        <button 
                                            onClick={logout}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[10px] font-bold text-rose-500 hover:bg-rose-50 rounded-lg transition-all uppercase tracking-widest mt-1"
                                        >
                                            <LogOut className="h-3.5 w-3.5" />
                                            Sign Out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-[1000px] mx-auto w-full px-6 py-10">
                {/* Header section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Your Forms</h1>
                        <p className="text-slate-500 text-sm font-medium">Manage and view responses for generated forms.</p>
                    </div>
                    <div className="flex items-center gap-3 relative">
                        <button 
                            onClick={() => setTemplatesOpen(!templatesOpen)}
                            className="btn-secondary !px-4 bg-white hidden sm:flex"
                        >
                            <LayoutTemplate className="h-4 w-4 text-slate-400" />
                            Templates
                            <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${templatesOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {templatesOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setTemplatesOpen(false)}></div>
                                <div className="absolute top-full mt-2 right-0 sm:right-auto sm:left-0 w-64 card !p-2 z-20 shadow-xl animate-fade-in origin-top-right sm:origin-top-left">
                                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Quick Templates</p>
                                    </div>
                                    <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
                                        {DAILY_TEMPLATES.map((tpl, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => {
                                                    setInitialPrompt(tpl.prompt);
                                                    setAutoStart(true);
                                                    setWizardOpen(true);
                                                    setTemplatesOpen(false);
                                                }}
                                                className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all text-left"
                                            >
                                                {tpl.title}
                                                <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        <button 
                            onClick={() => {
                                setInitialPrompt('');
                                setAutoStart(false);
                                setWizardOpen(true);
                            }}
                            className="btn-primary"
                        >
                            <Plus className="h-4 w-4" />
                            New Form
                        </button>
                    </div>
                </div>

                {/* Forms grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400 mb-3" />
                        <p className="text-slate-500 font-medium text-sm">Loading workspace...</p>
                    </div>
                ) : forms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 border border-dashed border-slate-200 rounded-2xl bg-white/50">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
                            <FileText className="h-5 w-5 text-slate-400" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-800 mb-1">No forms found</h3>
                        <p className="text-slate-500 text-sm mb-6 font-medium">Create your first form to start collecting responses.</p>
                        <button onClick={() => setWizardOpen(true)} className="btn-secondary">
                            Create Form
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {forms.map(form => (
                            <div key={form._id} className="card flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-600 shadow-sm">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-full uppercase ${
                                        form.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                        form.status === 'expired' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                                        'bg-slate-50 text-slate-500 border border-slate-200'
                                    }`}>
                                        {form.status}
                                    </span>
                                </div>
                                
                                <h3 className="font-semibold text-base mb-1 line-clamp-1 text-slate-900">{form.formTitle}</h3>
                                
                                <div className="mt-auto pt-4 flex items-center gap-4 mb-5">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                                        {new Date(form.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                        <BarChart2 className="h-3.5 w-3.5 text-slate-400" />
                                        {form.respondentCount} responses
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-4 mt-auto space-y-2.5">
                                    <div className="grid grid-cols-2 gap-2">
                                        <a 
                                            href={form.publicUrl} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="btn-secondary !py-2 !text-[10px] justify-center gap-1.5 h-9"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            View
                                        </a>
                                        <button 
                                            onClick={() => setEditModalData({ id: form._id, title: form.formTitle })} 
                                            className="btn-primary !py-2 !text-[10px] justify-center gap-1.5 h-9"
                                        >
                                            <Settings className="h-3.5 w-3.5" />
                                            Edit
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-4 gap-1.5">
                                        <a 
                                            href={form.editUrl} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="flex items-center justify-center py-1.5 rounded-lg border border-slate-200 text-[9px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all h-8"
                                            title="Native Editor"
                                        >
                                            <PenTool className="h-3 w-3" />
                                        </a>
                                        <button 
                                            onClick={() => handleCopyLink(form.publicUrl)} 
                                            className="flex items-center justify-center py-1.5 rounded-lg border border-slate-200 text-[9px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all h-8"
                                            title="Copy Link"
                                        >
                                            <Copy className="h-3 w-3" />
                                        </button>
                                        <button 
                                            onClick={() => setQrModalData({ url: form.publicUrl, title: form.formTitle })} 
                                            className="flex items-center justify-center py-1.5 rounded-lg border border-slate-200 text-[9px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all h-8"
                                            title="QR Code"
                                        >
                                            <QrCode className="h-3 w-3" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(form._id)} 
                                            className="flex items-center justify-center py-1.5 rounded-lg border border-transparent hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all h-8"
                                            title="Delete Form"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    <div className="pt-2.5 border-t border-slate-100/60 overflow-hidden">
                                        <div className="animate-marquee flex gap-12 mb-2 px-0.5">
                                            <p className="text-[10px] font-bold text-slate-400 tracking-[0.05em] whitespace-nowrap">
                                                Want to expand google form?
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 tracking-[0.05em] whitespace-nowrap">
                                                Want to expand google form?
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => handleExpandClick(form)}
                                            disabled={subChecking}
                                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-600 hover:bg-indigo-100 transition-all disabled:opacity-40 shadow-sm shadow-indigo-500/5 group"
                                        >
                                            {subChecking ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Sparkles className="h-3.5 w-3.5 group-hover:animate-pulse" />
                                            )}
                                            Expand with AI
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Footer />

            {/* QR Code Modal */}
            {qrModalData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setQrModalData(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center animate-slide-up relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setQrModalData(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg transition-colors border border-slate-200/50">
                            <X className="w-4 h-4" />
                        </button>
                        
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4 border border-blue-100 shadow-sm text-blue-500">
                            <QrCode className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1 max-w-[250px] text-center" title={qrModalData.title}>{qrModalData.title}</h3>
                        <p className="text-xs text-slate-500 mb-6 text-center font-medium max-w-[220px]">Point your mobile camera at this QR code to quickly access the live form.</p>
                        
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-2">
                            <QRCodeSVG value={qrModalData.url} size={180} level="M" includeMargin={false} />
                        </div>
                    </div>
                </div>
            )}

            <AIWizard 
                isOpen={wizardOpen} 
                onClose={() => setWizardOpen(false)} 
                onSuccess={(newForm) => setForms([newForm, ...forms])}
                subscription={subscription}
                initialPrompt={initialPrompt}
                autoStart={autoStart}
            />

            <ExpandWizard
                isOpen={!!expandModalData}
                onClose={() => setExpandModalData(null)}
                formId={expandModalData?.id}
                formTitle={expandModalData?.title}
                onSuccess={() => fetchForms()}
            />

            <EditWizard
                isOpen={!!editModalData}
                onClose={() => setEditModalData(null)}
                formId={editModalData?.id}
                formTitle={editModalData?.title}
            />

            <PricingModal
                isOpen={pricingOpen}
                onClose={() => setPricingOpen(false)}
            />
        </div>
    );
};

export default Dashboard;
