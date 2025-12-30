import React, { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, Settings, Activity, Menu, LogOut, Wallet, User, BookOpen, BarChart3, DollarSign, LineChart, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { MarketTicker } from '../components/MarketTicker';

// Market hours check (IST timezone) - same as MarketTicker
const isMarketOpen = (): boolean => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    
    const day = istTime.getUTCDay();
    const hours = istTime.getUTCHours();
    const minutes = istTime.getUTCMinutes();
    const currentMinutes = hours * 60 + minutes;
    
    if (day === 0 || day === 6) return false;
    
    const marketOpen = 9 * 60 + 15;
    const marketClose = 15 * 60 + 30;
    
    return currentMinutes >= marketOpen && currentMinutes <= marketClose;
};

interface SidebarProps {
    activePage: string;
    onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'portfolio', label: 'Portfolio', icon: Wallet },
        { id: 'strategies', label: 'Strategies', icon: TrendingUp },
        { id: 'live', label: 'Live Trading', icon: Activity },
        { id: 'paper-trading', label: 'Paper Trading', icon: DollarSign },
        { id: 'live-trading', label: 'Live Trading Desk', icon: Zap },
        { id: 'market-data', label: 'Market Data', icon: LineChart },
        { id: 'live-charts', label: 'Live Charts', icon: BarChart3 },
        { id: 'analysis', label: 'Market Analysis', icon: TrendingUp },
        { id: 'api', label: 'API Reference', icon: BookOpen },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="w-64 bg-[#09090b] border-r border-[#27272a] h-screen flex flex-col hidden md:flex">
            <div className="p-6 border-b border-[#27272a]">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Activity className="text-white w-5 h-5" />
                    </div>
                    <h1 className="text-lg font-bold text-[#fafafa] tracking-tight">AlgoTrade<span className="text-blue-500">Pro</span></h1>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={cn(
                            "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                            activePage === item.id
                                ? "bg-[#27272a] text-blue-400 border border-[#27272a]"
                                : "text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#27272a]/50"
                        )}
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-[#27272a]">
                <button
                    onClick={async () => {
                        if (confirm('Are you sure you want to logout?')) {
                            try {
                                await fetch('http://127.0.0.1:8001/api/auth/logout', { method: 'POST' });
                                window.location.href = '/'; // Redirect to root (which will redirect to login if auth check fails)
                            } catch (e) {
                                console.error(e);
                                window.location.href = '/';
                            }
                        }
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-[#ef4444] hover:text-red-300 hover:bg-[#ef4444]/10 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

interface HeaderProps {
    user?: any;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
    const [marketStatus, setMarketStatus] = useState<'OPEN' | 'CLOSED'>(isMarketOpen() ? 'OPEN' : 'CLOSED');

    useEffect(() => {
        const updateMarketStatus = () => {
            setMarketStatus(isMarketOpen() ? 'OPEN' : 'CLOSED');
        };

        // Update immediately
        updateMarketStatus();

        // Check every minute
        const interval = setInterval(updateMarketStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header className="h-16 bg-[#09090b]/50 backdrop-blur-md border-b border-[#27272a] flex items-center justify-between px-6 sticky top-0 z-50">
            <div className="flex items-center md:hidden">
                <Menu className="text-zinc-400" />
            </div>
            <div className="hidden md:flex items-center space-x-4">
                <div className="flex flex-col">
                    <span className="text-xs text-[#a1a1aa] font-medium uppercase">Market Status</span>
                    <span className={`text-sm font-bold flex items-center gap-1 ${
                        marketStatus === 'OPEN' ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                        <span className={`w-2 h-2 rounded-full ${
                            marketStatus === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                        }`}></span>
                        {marketStatus}
                    </span>
                </div>
                <div className="h-8 w-px bg-[#27272a] mx-4"></div>

                {/* Live Customizable Ticker */}
                <MarketTicker />
            </div>

            <div className="flex items-center space-x-4">
                {user && (
                    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#27272a]/50 border border-[#27272a]">
                        <User className="w-4 h-4 text-blue-400" />
                        <div className="flex flex-col">
                            <span className="text-xs text-[#a1a1aa] font-medium">Connected as</span>
                            <span className="text-sm font-semibold text-[#fafafa]">
                                {user.name || user.email || 'Fyers User'}
                            </span>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-sm text-[#a1a1aa]">Live Config</span>
                </div>
            </div>
        </header>
    )
}
