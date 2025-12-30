import { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Zap } from 'lucide-react';

interface LoginProps {
    onAuthSuccess?: () => void;
}

export default function Login({ onAuthSuccess }: LoginProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check for login success in URL
        const params = new URLSearchParams(window.location.search);
        if (params.get('login') === 'success') {
            // Auth was successful, trigger callback
            if (onAuthSuccess) {
                onAuthSuccess();
            }
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname);
        } else if (params.get('error')) {
            setError(`Login failed: ${params.get('error')}`);
        }
    }, [onAuthSuccess]);

    const handleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://127.0.0.1:8001/api/auth/login');
            const data = await response.json();
            if (data.status === 'success' && data.login_url) {
                window.location.href = data.login_url;
            } else {
                setError(data.detail || 'Failed to get login URL');
            }
        } catch (err: any) {
            setError(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Activity className="w-8 h-8 text-emerald-400" />
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">Smart Algo Trade</h1>
                    </div>
                    <p className="text-[#a1a1aa]">Algorithmic Trading Platform</p>
                </div>

                <div className="bg-[#09090b] border border-[#27272a] rounded-lg p-8 shadow-2xl">
                    {error && <div className="mb-4 p-3 bg-[#ef4444]/10 border border-[#ef4444] rounded text-sm text-[#ef4444]">{error}</div>}

                    <h2 className="text-lg font-semibold mb-6 text-center text-[#fafafa]">Sign in to your account</h2>
                    
                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition shadow-lg hover:shadow-emerald-500/50"
                    >
                        {loading ? 'Redirecting to Fyers...' : 'Login with Fyers'}
                    </button>

                    <div className="mt-8 space-y-2 text-xs text-[#a1a1aa]">
                        <div className="flex gap-2"><Zap className="w-4 h-4" /> Real-time market data</div>
                        <div className="flex gap-2"><ShieldCheck className="w-4 h-4" /> Secure authentication</div>
                        <div className="flex gap-2"><Activity className="w-4 h-4" /> Portfolio management</div>
                    </div>
                </div>

                <p className="text-center text-[#a1a1aa] text-xs mt-6">Powered by Fyers API • React + FastAPI</p>
            </div>
        </div>
    );
}
