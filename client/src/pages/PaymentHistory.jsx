import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    Command, ArrowLeft, CreditCard, Shield, 
    Calendar, Clock, Mail, Phone, ExternalLink, Loader2,
    LogOut, Crown
} from 'lucide-react';
import api from '../services/api';
import Footer from '../components/Layouts/Footer';

const PaymentHistory = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data } = await api.get('/subscription/history');
                setHistory(data);
            } catch (error) {
                console.error('Failed to fetch history:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900 font-sans selection:bg-blue-500/20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 h-14 flex items-center">
                <div className="max-w-[1000px] mx-auto w-full px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/dashboard')} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors mr-1">
                            <ArrowLeft className="h-4 w-4 text-slate-500" />
                        </button>
                        <div 
                            onClick={() => navigate('/dashboard')} 
                            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                        >
                            <div className="flex items-center justify-center w-7 h-7 bg-white border border-slate-200/60 shadow-sm rounded-lg">
                                <Command className="h-4 w-4 text-slate-800" strokeWidth={2} />
                            </div>
                            <div className="font-semibold text-sm text-slate-900 tracking-tight">AI Form Builder</div>
                        </div>
                    </div>

                    <div className="relative">
                        <div 
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition-colors"
                        >
                            {user?.profilePicture && (
                                <img src={user.profilePicture} alt="Profile" className="w-7 h-7 rounded-full border border-slate-200" />
                            )}
                            <span className="text-xs font-semibold text-slate-700 hidden md:block">{user?.name}</span>
                        </div>

                        {/* USER DROPDOWN */}
                        {userMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)}></div>
                                <div className="absolute right-0 mt-2 w-56 card !p-2 z-20 shadow-xl animate-fade-in origin-top-right">
                                    <div className="px-3 py-3 border-b border-slate-100 mb-1">
                                        <p className="text-xs font-black text-slate-900 truncate">{user?.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 truncate uppercase mt-0.5">{user?.email}</p>
                                    </div>
                                    
                                    <button 
                                        onClick={() => { navigate('/dashboard'); setUserMenuOpen(false); }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[10px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all uppercase tracking-widest"
                                    >
                                        <Command className="h-3.5 w-3.5" />
                                        Dashboard
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
            </header>

            <main className="flex-1 max-w-[800px] mx-auto w-full px-6 py-12">
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Payment History</h1>
                    <p className="text-slate-500 text-sm font-medium">View and manage your subscription billing details.</p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400 mb-3" />
                        <p className="text-slate-500 font-medium text-sm">Loading your records...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="card !p-12 text-center flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 border border-slate-100">
                            <CreditCard className="h-7 w-7 text-slate-300" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">No transactions yet</h2>
                        <p className="text-slate-500 text-sm max-w-[280px] mb-8 font-medium">When you subscribe to a plan, your billing details will appear here.</p>
                        <button onClick={() => navigate('/dashboard')} className="btn-primary">
                            Back to Dashboard
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {history.map((item) => (
                            <div key={item.id} className="card !p-0 overflow-hidden group hover:border-indigo-200 transition-all">
                                <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 bg-slate-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm group-hover:text-indigo-600 transition-colors">
                                            <Shield className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900">Stripe Subscription</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{item.status}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <p className="text-xl font-black text-slate-900 tracking-tight">{item.amount} {item.currency}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Transaction Success</p>
                                    </div>
                                </div>
                                
                                <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3" /> Date
                                        </p>
                                        <p className="text-sm font-bold text-slate-700">{item.date}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <Clock className="h-3 w-3" /> Time
                                        </p>
                                        <p className="text-sm font-bold text-slate-700">{item.time}</p>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <Mail className="h-3 w-3" /> Email
                                        </p>
                                        <p className="text-sm font-bold text-slate-700 truncate" title={item.email}>{item.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <Phone className="h-3 w-3" /> Phone
                                        </p>
                                        <p className="text-sm font-bold text-slate-700">{item.phone}</p>
                                    </div>
                                </div>

                                {item.pdf && (
                                    <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end">
                                        <a 
                                            href={item.pdf} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-widest transition-colors"
                                        >
                                            View Invoice
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default PaymentHistory;
