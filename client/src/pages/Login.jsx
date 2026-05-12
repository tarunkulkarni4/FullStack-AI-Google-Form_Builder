import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Command, ArrowRight, Sparkles, Box, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const BladeSpinner = () => (
    <div className="relative w-4 h-4">
        {[...Array(12)].map((_, i) => (
            <div
                key={i}
                className="absolute w-full h-full"
                style={{ transform: `rotate(${i * 30}deg)` }}
            >
                <div 
                    className="mx-auto w-[1.5px] h-[4px] bg-slate-500 rounded-full"
                    style={{
                        animation: `blade-spin 1s linear infinite`,
                        animationDelay: `-${1 - i * (1/12)}s`
                    }}
                />
            </div>
        ))}
    </div>
);

const FeatureChip = ({ icon: Icon, label }) => (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200/60 shadow-sm text-xs font-semibold text-slate-600">
        <Icon className="h-3.5 w-3.5 text-blue-500" />
        {label}
    </div>
);

const Login = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    useEffect(() => {
        if (user && !loading) {
            navigate('/dashboard');
        }
        
        const error = searchParams.get('error');
        if (error === 'auth_failed') {
            toast.error('Authentication failed. Please try again.');
        } else if (error === 'session_expired') {
            toast.error('Your session expired. Please log in again.');
        }
    }, [user, loading, navigate, searchParams]);

    const handleLogin = () => {
        setIsGoogleLoading(true);
        // Redirect to backend auth route
        window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`;
    };

    if (loading) return null;

    return (
        <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900 relative selection:bg-blue-500/20 overflow-hidden font-sans">
            {/* Minimalist Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50"></div>
            
            {/* Subtle Gradient Blobs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-br from-blue-400/20 via-purple-400/10 to-emerald-400/10 blur-[100px] rounded-[100%] pointer-events-none"></div>

            <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 relative z-10">
                
                {/* Main Content Area */}
                <div className="w-full max-w-[440px] flex flex-col items-center">
                    
                    {/* Floating Logo Card */}
                    <div className="mb-8 relative group">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-2xl group-hover:bg-blue-500/30 transition-all duration-500"></div>
                        <div className="relative flex items-center justify-center w-14 h-14 bg-white border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-200/50">
                            <Command className="h-6 w-6 text-slate-800" strokeWidth={2} />
                        </div>
                    </div>

                    {/* Badge */}
                    <div className="inline-flex items-center justify-center px-3 py-1 mb-6 rounded-full border border-blue-100 bg-blue-50 text-[10px] font-bold tracking-widest text-blue-600 uppercase shadow-sm">
                        NexForm Platform
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-center text-slate-900 leading-tight">
                        Intelligent form <br className="hidden sm:block" /> creation.
                    </h1>

                    <p className="text-sm font-medium text-slate-500 mb-8 max-w-[340px] mx-auto text-center leading-relaxed">
                        Generate and deploy fully functional Google Forms from natural language prompts in seconds.
                    </p>

                    {/* Feature chips */}
                    <div className="flex flex-wrap justify-center gap-2 mb-10">
                        <FeatureChip icon={Sparkles} label="AI Generation" />
                        <FeatureChip icon={Box} label="Auto-Structure" />
                        <FeatureChip icon={Zap} label="Instant Deploy" />
                    </div>

                    {/* Refined Google Button - Compact & Premium */}
                    <div className="flex justify-center w-full mb-8">
                        <button
                            onClick={handleLogin}
                            disabled={isGoogleLoading}
                            className="group relative flex items-center justify-center gap-3 rounded-full bg-white border border-slate-200/80 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:shadow-md hover:border-slate-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto min-w-[240px]"
                        >
                            {isGoogleLoading ? (
                                <BladeSpinner />
                            ) : (
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            )}
                            <span>{isGoogleLoading ? 'Connecting...' : 'Continue with Google'}</span>
                        </button>
                    </div>

                    {/* Footer note moved back under the button */}
                    <div className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
                        Securely connects to Google Workspace
                    </div>
                </div>
            </div>

            {/* Empty space at the bottom */}
            <div className="pb-10"></div>
        </div>
    );
};

export default Login;
