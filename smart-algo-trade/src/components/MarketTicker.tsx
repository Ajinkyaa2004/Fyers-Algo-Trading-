import React, { useState, useEffect } from 'react';
import { Search, X, Plus, TrendingUp, TrendingDown, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TickerSymbol {
    symbol: string;
    exchange: string;
    price: number;
    change: number; // Percentage change
    prevClose?: number; // Previous close for calculating change
}

interface SearchResult {
    instrument_token: number;
    exchange_token: string;
    tradingsymbol: string;
    name: string;
    last_price: number;
    expiry: string;
    strike: number;
    tick_size: number;
    lot_size: number;
    instrument_type: string;
    segment: string;
    exchange: string;
}

// Market hours check (IST timezone)
const isMarketOpen = (): boolean => {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    
    const day = istTime.getUTCDay(); // 0 = Sunday, 6 = Saturday
    const hours = istTime.getUTCHours();
    const minutes = istTime.getUTCMinutes();
    const currentMinutes = hours * 60 + minutes;
    
    // Market closed on weekends
    if (day === 0 || day === 6) return false;
    
    // Market hours: 9:15 AM to 3:30 PM IST
    const marketOpen = 9 * 60 + 15;  // 9:15 AM
    const marketClose = 15 * 60 + 30; // 3:30 PM
    
    return currentMinutes >= marketOpen && currentMinutes <= marketClose;
};

export const MarketTicker: React.FC = () => {
    const [watchlist, setWatchlist] = useState<TickerSymbol[]>(() => {
        const saved = localStorage.getItem('marketTickerWatchlist');
        return saved ? JSON.parse(saved) : [
            { symbol: 'NIFTY 50', exchange: 'NSE', price: 0, change: 0, prevClose: 0 },
            { symbol: 'NIFTY BANK', exchange: 'NSE', price: 0, change: 0, prevClose: 0 },
            { symbol: 'NIFTY IT', exchange: 'NSE', price: 0, change: 0, prevClose: 0 }
        ];
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [marketStatus, setMarketStatus] = useState<'OPEN' | 'CLOSED'>(isMarketOpen() ? 'OPEN' : 'CLOSED');

    // Auto-updating price fetcher using HTTP polling (more reliable than WebSockets)
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                // Use actual Fyers symbol format for indices
                const symbolMap: { [key: string]: string } = {
                    'NIFTY 50': 'NSE:NIFTY50-INDEX',
                    'NIFTY BANK': 'NSE:NIFTYBANK-INDEX',
                    'NIFTY IT': 'NSE:NIFTYIT-INDEX'
                };

                const symbolsParam = watchlist
                    .map(w => symbolMap[w.symbol] || `${w.exchange}:${w.symbol}`)
                    .join(',');
                
                if (!symbolsParam) return;

                const response = await fetch(`http://127.0.0.1:8001/api/market/quote?symbols=${encodeURIComponent(symbolsParam)}`);
                const data = await response.json();

                if (data.status === 'success' && data.data && Object.keys(data.data).length > 0) {
                    setWatchlist(prev => prev.map(item => {
                        const fyersSymbol = symbolMap[item.symbol] || `${item.exchange}:${item.symbol}`;
                        const quote = data.data[fyersSymbol];
                        
                        if (quote && quote.v) {
                            const price = quote.v.lp || 0; // last price
                            const openPrice = quote.v.open_price || price;
                            const change = openPrice > 0 ? ((price - openPrice) / openPrice) * 100 : 0;
                            return { ...item, price, change, prevClose: openPrice };
                        }
                        return item;
                    }));
                } else {
                    // If API returns no data, set demo values when market is closed
                    if (!isMarketOpen()) {
                        setWatchlist(prev => prev.map(item => {
                            if (item.price === 0) {
                                // Set realistic demo values for visualization
                                const demoData: { [key: string]: { price: number; change: number } } = {
                                    'NIFTY 50': { price: 21731.45, change: 0.32 },
                                    'NIFTY BANK': { price: 46142.30, change: -0.18 },
                                    'NIFTY IT': { price: 35428.75, change: 1.24 }
                                };
                                const demo = demoData[item.symbol];
                                if (demo) {
                                    return { ...item, price: demo.price, change: demo.change };
                                }
                            }
                            return item;
                        }));
                    }
                }
            } catch (e) {
                console.error("Failed to fetch prices:", e);
            }
        };

        // Check market status every minute
        const updateMarketStatus = () => {
            setMarketStatus(isMarketOpen() ? 'OPEN' : 'CLOSED');
        };

        // Fetch immediately on mount
        fetchPrices();
        updateMarketStatus();

        // Faster refresh when market is open (5s), slower when closed (30s)
        const refreshInterval = isMarketOpen() ? 5000 : 30000;
        const priceInterval = setInterval(fetchPrices, refreshInterval);
        const statusInterval = setInterval(updateMarketStatus, 60000); // Check status every minute

        // Cleanup intervals on unmount or watchlist change
        return () => {
            clearInterval(priceInterval);
            clearInterval(statusInterval);
        };
    }, [watchlist?.length]);

    // Persist Watchlist
    useEffect(() => {
        localStorage.setItem('marketTickerWatchlist', JSON.stringify(watchlist));
    }, [watchlist]);

    // Search Handler
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length > 2) {
                setIsSearching(true);
                try {
                    const response = await fetch(`http://127.0.0.1:8001/api/market/instruments/search/${searchQuery}`);
                    const data = await response.json();
                    if (data.status === 'success') {
                        setSearchResults(data.results.slice(0, 10)); // Limit to 10
                    }
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const addToWatchlist = (result: SearchResult) => {
        if (watchlist.length >= 3) {
            toast.warning('Watchlist Limit Reached', {
                description: 'You can only pin 3 instruments. Remove one first.'
            });
            return;
        }
        const newItem = { symbol: result.tradingsymbol, exchange: result.exchange, price: 0, change: 0, prevClose: 0 };
        setWatchlist([...watchlist, newItem]);
        setSearchQuery('');
        setSearchResults([]);
        setIsModalOpen(false);
    };

    const removeFromWatchlist = (symbol: string) => {
        setWatchlist(watchlist.filter(w => w.symbol !== symbol));
    };

    return (
        <div className="flex items-center gap-4">
            {/* Ticker Items */}
            {watchlist.map((item) => (
                <div key={item.symbol} className="flex flex-col min-w-[140px] relative group">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[#a1a1aa] font-medium uppercase truncate max-w-[90px]">{item.symbol}</span>
                        <button
                            onClick={() => removeFromWatchlist(item.symbol)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#a1a1aa] hover:text-[#ef4444]"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#fafafa]">
                            {item.price > 0 ? `₹${item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Loading...'}
                        </span>
                        {item.price > 0 && (
                            <span className={`text-xs font-medium flex items-center gap-0.5 ${item.change > 0 ? 'text-emerald-500' : item.change < 0 ? 'text-red-500' : 'text-[#a1a1aa]'
                                }`}>
                                {item.change > 0 ? <TrendingUp className="w-3 h-3" /> : item.change < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                                {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}%
                            </span>
                        )}
                    </div>
                </div>
            ))}

            {/* Add Button (if slots available) */}
            {watchlist.length < 3 && (
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#27272a] hover:border-[#a1a1aa] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-xs font-medium">Add</span>
                </button>
            )}

            {/* Search Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-[#09090b] border border-[#27272a] rounded-xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-[#27272a] flex items-center gap-3">
                            <Search className="w-5 h-5 text-[#a1a1aa]" />
                            <input
                                type="text"
                                placeholder="Search symbol (e.g. INF, BANKNIFTY, GOLD)..."
                                className="bg-transparent border-none focus:outline-none text-[#fafafa] w-full placeholder-[#a1a1aa]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                            <button onClick={() => setIsModalOpen(false)} className="text-[#a1a1aa] hover:text-[#fafafa]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto">
                            {isSearching ? (
                                <div className="p-4 text-center text-[#a1a1aa] flex items-center justify-center gap-2">
                                    <Clock className="w-4 h-4 animate-spin" /> Searching...
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="divide-y divide-[#27272a]">
                                    {searchResults.map((result) => (
                                        <button
                                            key={result.instrument_token}
                                            onClick={() => addToWatchlist(result)}
                                            className="w-full p-3 flex items-center justify-between hover:bg-[#27272a] transition-colors text-left"
                                        >
                                            <div>
                                                <div className="font-medium text-[#fafafa]">{result.tradingsymbol}</div>
                                                <div className="text-xs text-[#a1a1aa]">{result.name || result.exchange} {result.segment}</div>
                                            </div>
                                            <div className="text-xs font-medium bg-[#27272a] px-2 py-1 rounded text-[#fafafa] border border-[#27272a]">
                                                {result.exchange}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : searchQuery.length > 2 ? (
                                <div className="p-4 text-center text-[#a1a1aa]">No results found</div>
                            ) : (
                                <div className="p-4 text-center text-[#a1a1aa] text-sm">
                                    Type at least 3 characters to search for Indices, Stocks, F&O, Commodities, or Currrency.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
