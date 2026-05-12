import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SmartLinkRedirect from './pages/SmartLinkRedirect';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentHistory from './pages/PaymentHistory';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#FAFAFA]">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        </div>
    );
    return user ? children : <Navigate to="/" />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Toaster position="bottom-right" toastOptions={{
                    style: {
                        background: '#ffffff',
                        color: '#0f172a',
                        border: '1px solid #e2e8f0',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    },
                }} />
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/f/:formId" element={<SmartLinkRedirect />} />
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        }
                    />


                    <Route
                        path="/payment/success"
                        element={
                            <PrivateRoute>
                                <PaymentSuccess />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/payment-history"
                        element={
                            <PrivateRoute>
                                <PaymentHistory />
                            </PrivateRoute>
                        }
                    />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
