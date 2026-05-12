import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Loader2, AlertCircle, Clock, CheckCircle } from 'lucide-react';

const SmartLinkRedirect = () => {
    const { formId } = useParams();
    const [status, setStatus] = useState('loading'); // loading, active, error, expired, limit
    const [data, setData] = useState(null);

    useEffect(() => {
        const checkForm = async () => {
            try {
                // Note: Direct axios call since this is a public endpoint (no auth required)
                const response = await axios.get(`http://localhost:5000/f/${formId}`);
                const result = response.data;
                
                setData(result);
                
                if (result.status === 'ACTIVE') {
                    // Valid form, redirect to Google Forms
                    window.location.href = result.publicUrl;
                } else {
                    setStatus(result.status.toLowerCase());
                }
            } catch (error) {
                console.error('Smart link error:', error);
                setStatus('error');
            }
        };

        checkForm();
    }, [formId]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-light)]">
                <Loader2 className="h-10 w-10 animate-spin text-[var(--primary)] mb-4" />
                <p className="font-medium text-[var(--text-secondary)] animate-pulse">Loading form...</p>
            </div>
        );
    }

    if (status === 'active') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-light)]">
                <div className="card text-center max-w-md w-full mx-4">
                    <CheckCircle className="h-12 w-12 text-[var(--success)] mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Redirecting...</h2>
                    <p className="text-[var(--text-secondary)]">Taking you to the form.</p>
                    <p className="text-sm mt-4 text-[var(--text-muted)]">
                        If you are not redirected, <a href={data?.publicUrl} className="text-[var(--primary)] hover:underline">click here</a>.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-light)] p-4">
            <div className="card text-center max-w-md w-full border-l-4 border-l-[var(--danger)]">
                {status === 'expired' ? (
                    <Clock className="h-16 w-16 text-[var(--warning)] mx-auto mb-6" />
                ) : status === 'limit_reached' ? (
                    <AlertCircle className="h-16 w-16 text-[var(--warning)] mx-auto mb-6" />
                ) : (
                    <AlertCircle className="h-16 w-16 text-[var(--danger)] mx-auto mb-6" />
                )}
                
                <h1 className="text-2xl font-black mb-3">
                    {status === 'expired' ? 'Form Expired' : 
                     status === 'limit_reached' ? 'Limit Reached' : 
                     'Form Not Found'}
                </h1>
                
                <p className="text-[var(--text-secondary)] mb-6 text-lg">
                    {data?.message || 'The form you are looking for does not exist or is unavailable.'}
                </p>
                
                {data?.title && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mb-6">
                        <span className="text-sm text-[var(--text-muted)] block mb-1">Form Name</span>
                        <span className="font-semibold text-gray-800">{data.title}</span>
                    </div>
                )}
                
                <div className="text-xs text-[var(--text-muted)] font-medium tracking-wide uppercase mt-8 pt-4 border-t border-[var(--border-light)]">
                    Powered by AI Form Builder
                </div>
            </div>
        </div>
    );
};

export default SmartLinkRedirect;
