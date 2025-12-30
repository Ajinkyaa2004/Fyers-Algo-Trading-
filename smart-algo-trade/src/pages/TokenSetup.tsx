import { useState } from 'react';
import { Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TokenSetup() {
  const [authCode, setAuthCode] = useState('');

  const appId = "3XL42TP2PU-100";
  const redirectUri = "https://www.google.com/";
  const authUrl = `https://api.fyers.in/api/v3/generate-authcode?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=state`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied', { description: 'Text copied to clipboard' });
  };

  const testAuthCode = async () => {
    if (!authCode) {
      toast.error('Missing Auth Code', {
        description: 'Please enter your authentication code'
      });
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8001/api/auth/process-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth_code: authCode })
      });
      const data = await response.json();
      toast.success('Auth Code Processed', {
        description: 'Your authentication code has been processed successfully'
      });
    } catch (error) {
      toast.error('Error', {
        description: String(error)
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">Fyers Token Setup</h1>
          <p className="text-zinc-400 mb-6">Follow these steps to authenticate:</p>

          {/* Step 1 */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold">
                  1
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-zinc-100">Get Authorization Code</h3>
                <p className="text-zinc-400 mt-2 mb-4">Click the button below to open Fyers login:</p>
                <a
                  href={authUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Fyers Login
                </a>
                <p className="text-zinc-500 text-sm mt-3">
                  After login, you'll be redirected to Google. Copy the <code className="bg-zinc-800 px-2 py-1 rounded">auth_code</code> from the URL.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold">
                  2
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-zinc-100">Paste Auth Code</h3>
                <textarea
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder="Paste the auth_code here..."
                  className="w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-zinc-100 placeholder-zinc-500 font-mono text-sm"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold">
                  3
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-zinc-100">Verify & Get Token</h3>
                <button
                  onClick={testAuthCode}
                  className="mt-3 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-semibold"
                >
                  Process Auth Code
                </button>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mt-8">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-400">App Details</h4>
                <p className="text-sm text-zinc-300 mt-2">
                  <strong>App ID:</strong> {appId}
                  <button
                    onClick={() => copyToClipboard(appId)}
                    className="ml-2 text-blue-400 hover:text-blue-300"
                  >
                    <Copy className="w-4 h-4 inline" />
                  </button>
                </p>
                <p className="text-sm text-zinc-300 mt-1">
                  <strong>Redirect URI:</strong> {redirectUri}
                  <button
                    onClick={() => copyToClipboard(redirectUri)}
                    className="ml-2 text-blue-400 hover:text-blue-300"
                  >
                    <Copy className="w-4 h-4 inline" />
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
