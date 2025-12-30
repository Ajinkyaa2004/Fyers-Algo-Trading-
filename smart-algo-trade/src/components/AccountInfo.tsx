import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader, DollarSign, User, TrendingUp, TrendingDown } from 'lucide-react';

interface FundsData {
  payin_amount: number;
  payout_amount: number;
  net_available_margin: number;
  used_margin: number;
  available_margin: number;
  opening_balance: number;
  equity: number;
  collateral: number;
  addon_available: number;
}

interface ProfileData {
  email: string;
  mobile: string;
  broker: string;
  demat_id: string;
  trading_symbol: string;
}

const AccountInfo: React.FC = () => {
  const [funds, setFunds] = useState<FundsData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchAccountData = async () => {
    setLoading(true);
    setError('');
    try {
      const [fundsRes, profileRes] = await Promise.all([
        fetch('/api/portfolio/funds'),
        fetch('/api/portfolio/profile')
      ]);

      if (!fundsRes.ok || !profileRes.ok) {
        throw new Error('Failed to fetch account data');
      }

      const fundsData = await fundsRes.json();
      const profileData = await profileRes.json();

      if (fundsData.status === 'success') {
        setFunds(fundsData.data);
      }
      if (profileData.status === 'success') {
        setProfile(profileData.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="border border-gray-700 bg-gray-900 rounded-lg">
        <div className="p-6 border-b border-gray-700">
          <h3 className="flex items-center gap-2 text-white font-semibold text-lg">
            <User className="h-5 w-5" />
            Account Profile
          </h3>
          <p className="text-sm text-gray-400 mt-1">Trading account information</p>
        </div>
        <div className="p-6">
          {error ? (
            <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-3 rounded">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : profile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-white font-semibold">{profile.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Mobile</p>
                <p className="text-white font-semibold">{profile.mobile}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Broker</p>
                <p className="text-white font-semibold">{profile.broker}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Demat ID</p>
                <p className="text-white font-semibold">{profile.demat_id}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-400">Trading Symbol</p>
                <p className="text-white font-semibold">{profile.trading_symbol}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No profile data available</p>
          )}
        </div>
      </div>

      {/* Funds Card */}
      <div className="border border-gray-700 bg-gray-900 rounded-lg">
        <div className="p-6 border-b border-gray-700">
          <h3 className="flex items-center gap-2 text-white font-semibold text-lg">
            <DollarSign className="h-5 w-5" />
            Account Funds
          </h3>
          <p className="text-sm text-gray-400 mt-1">Available margins and balance</p>
        </div>
        <div className="p-6">
          {funds ? (
            <div className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded p-4">
                  <p className="text-sm text-gray-400">Available Margin</p>
                  <p className="text-2xl font-bold text-blue-400">
                    ₹{funds.available_margin?.toFixed(2) || 0}
                  </p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-4">
                  <p className="text-sm text-gray-400">Net Available Margin</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    ₹{funds.net_available_margin?.toFixed(2) || 0}
                  </p>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-gray-700">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">Opening Balance</p>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-lg font-semibold text-white">
                    ₹{funds.opening_balance?.toFixed(2) || 0}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">Used Margin</p>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  </div>
                  <p className="text-lg font-semibold text-white">
                    ₹{funds.used_margin?.toFixed(2) || 0}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Equity</p>
                  <p className="text-lg font-semibold text-white">
                    ₹{funds.equity?.toFixed(2) || 0}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Collateral</p>
                  <p className="text-lg font-semibold text-white">
                    ₹{funds.collateral?.toFixed(2) || 0}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Payin Amount</p>
                  <p className="text-lg font-semibold text-green-400">
                    ₹{funds.payin_amount?.toFixed(2) || 0}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Payout Amount</p>
                  <p className="text-lg font-semibold text-red-400">
                    ₹{funds.payout_amount?.toFixed(2) || 0}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm text-gray-400">Add-on Available</p>
                  <p className="text-lg font-semibold text-yellow-400">
                    ₹{funds.addon_available?.toFixed(2) || 0}
                  </p>
                </div>
              </div>

              {/* Margin Usage Indicator */}
              <div className="pt-4 border-t border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-400">Margin Utilization</p>
                  <p className="text-sm font-semibold text-white">
                    {funds.net_available_margin > 0
                      ? ((funds.used_margin / (funds.used_margin + funds.available_margin)) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        ((funds.used_margin || 0) / ((funds.used_margin || 0) + (funds.available_margin || 1))) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No funds data available</p>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={fetchAccountData}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 rounded-lg transition-all"
      >
        Refresh Account Data
      </button>
    </div>
  );
};

export default AccountInfo;
