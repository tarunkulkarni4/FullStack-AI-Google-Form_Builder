import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import api from '../services/api';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading | success | error

    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        if (!sessionId) {
            setStatus('error');
            return;
        }

        // Give it a moment, then verify session directly
        const timer = setTimeout(async () => {
            try {
                const formId = searchParams.get('formId');
                const formTitle = searchParams.get('formTitle');
                const { data } = await api.get(`/subscription/verify-session?session_id=${sessionId}`);
                
                if (data.isActive) {
                    navigate(`/dashboard?expand=true${formId ? `&formId=${formId}` : ''}${formTitle ? `&formTitle=${formTitle}` : ''}`);
                } else {
                    setStatus('pending');
                }
            } catch {
                setStatus('error');
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [sessionId]);

    useEffect(() => {
        if (status === 'success') {
            navigate('/dashboard?expand=true');
        }
    }, [status, navigate]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-10 max-w-md w-full text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-5">
                    <Loader2 className="w-7 h-7 text-slate-500 animate-spin" />
                </div>
                <h1 className="text-xl font-bold text-slate-800 mb-2">Finalizing Subscription…</h1>
                <p className="text-sm text-slate-500 font-medium">Entering the Expand Wizard in a second.</p>
            </div>
        </div>
    );
};

export default PaymentSuccess;
