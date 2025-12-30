import React, { useState } from 'react';
import { Code2, Copy, Check, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

interface ApiEndpoint {
  category: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'WS';
  path: string;
  description: string;
  params?: string[];
  example: string;
  response: string;
}

const ApiReference: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string>('');
  const [copied, setCopied] = useState<string>('');

  const endpoints: ApiEndpoint[] = [
    {
      category: 'Authentication',
      method: 'GET',
      path: '/api/auth/login',
      description: 'Get Fyers login URL for OAuth',
      example: 'http://127.0.0.1:8001/api/auth/login',
      response: '{\n  "status": "success",\n  "login_url": "https://api.fyers.in/api/v3/..."\n}'
    },
    {
      category: 'Authentication',
      method: 'POST',
      path: '/api/auth/process-code',
      description: 'Process authorization code from Fyers',
      params: ['auth_code (body)'],
      example: '{\n  "auth_code": "eyJ0..."\n}',
      response: '{\n  "status": "success",\n  "message": "Authentication successful",\n  "access_token": "..."\n}'
    },
    {
      category: 'Authentication',
      method: 'GET',
      path: '/api/auth/status',
      description: 'Check authentication status and get user profile',
      example: 'http://127.0.0.1:8001/api/auth/status',
      response: '{\n  "is_authenticated": true,\n  "user": {\n    "name": "John Doe",\n    "email": "john@fyers.in"\n  }\n}'
    },
    {
      category: 'Authentication',
      method: 'POST',
      path: '/api/auth/logout',
      description: 'Logout user and clear session',
      example: 'POST /api/auth/logout',
      response: '{\n  "status": "success",\n  "message": "Logged out successfully"\n}'
    },
    {
      category: 'Portfolio Data',
      method: 'GET',
      path: '/api/portfolio/profile',
      description: 'Get user profile information',
      example: 'http://127.0.0.1:8001/api/portfolio/profile',
      response: '{\n  "status": "success",\n  "data": {\n    "email": "user@fyers.in",\n    "mobile": "+91...",\n    "broker": "Fyers",\n    "demat_id": "12345678"\n  }\n}'
    },
    {
      category: 'Portfolio Data',
      method: 'GET',
      path: '/api/portfolio/funds',
      description: 'Get account funds and margins',
      example: 'http://127.0.0.1:8001/api/portfolio/funds',
      response: '{\n  "status": "success",\n  "data": {\n    "available_margin": 50000,\n    "used_margin": 25000,\n    "equity": 500000,\n    "collateral": 100000\n  }\n}'
    },
    {
      category: 'Portfolio Data',
      method: 'GET',
      path: '/api/portfolio/holdings',
      description: 'Get all current holdings',
      example: 'http://127.0.0.1:8001/api/portfolio/holdings',
      response: '{\n  "status": "success",\n  "data": [\n    {\n      "symbol": "NSE:SBIN-EQ",\n      "qty": 100,\n      "ltp": 500,\n      "pl": 5000\n    }\n  ]\n}'
    },
    {
      category: 'Portfolio Data',
      method: 'GET',
      path: '/api/portfolio/positions',
      description: 'Get open positions (net & day)',
      example: 'http://127.0.0.1:8001/api/portfolio/positions',
      response: '{\n  "status": "success",\n  "data": {\n    "net": [...],\n    "day": [...]\n  }\n}'
    },
    {
      category: 'Portfolio Data',
      method: 'GET',
      path: '/api/portfolio/orders',
      description: 'Get order history',
      example: 'http://127.0.0.1:8001/api/portfolio/orders',
      response: '{\n  "status": "success",\n  "data": [\n    {\n      "id": "1234567",\n      "symbol": "NSE:SBIN-EQ",\n      "qty": 10,\n      "status": "COMPLETE"\n    }\n  ]\n}'
    },
    {
      category: 'Market Data',
      method: 'GET',
      path: '/api/portfolio/quotes?symbols=NSE:SBIN-EQ',
      description: 'Get real-time quotes for symbols',
      params: ['symbols (query, comma-separated)'],
      example: 'http://127.0.0.1:8001/api/portfolio/quotes?symbols=NSE:SBIN-EQ,NSE:TCS-EQ',
      response: '{\n  "status": "success",\n  "data": {\n    "NSE:SBIN-EQ": {\n      "ltp": 500,\n      "bid": 499.90,\n      "ask": 500.10,\n      "volume": 1000000\n    }\n  }\n}'
    },
    {
      category: 'Market Data',
      method: 'GET',
      path: '/api/portfolio/depth?symbol=NSE:SBIN-EQ',
      description: 'Get market depth (5 bid/ask levels)',
      params: ['symbol (query)'],
      example: 'http://127.0.0.1:8001/api/portfolio/depth?symbol=NSE:SBIN-EQ',
      response: '{\n  "status": "success",\n  "data": {\n    "bid": [500, 499.90, 499.80, ...],\n    "ask": [500.10, 500.20, 500.30, ...]\n  }\n}'
    },
    {
      category: 'Market Data',
      method: 'GET',
      path: '/api/portfolio/history?symbol=NSE:SBIN-EQ&resolution=D',
      description: 'Get historical candlestick data',
      params: ['symbol', 'resolution (D/1/5/15/60/W/M)'],
      example: 'http://127.0.0.1:8001/api/portfolio/history?symbol=NSE:SBIN-EQ&resolution=D',
      response: '{\n  "status": "success",\n  "data": [\n    {\n      "time": 1609459200,\n      "open": 500,\n      "high": 510,\n      "low": 495,\n      "close": 505,\n      "volume": 1000000\n    }\n  ]\n}'
    },
    {
      category: 'Market Data',
      method: 'GET',
      path: '/api/portfolio/search?query=SBIN',
      description: 'Search for symbols',
      params: ['query (search term)'],
      example: 'http://127.0.0.1:8001/api/portfolio/search?query=SBIN',
      response: '{\n  "status": "success",\n  "data": [\n    {\n      "symbol": "NSE:SBIN-EQ",\n      "name": "State Bank of India"\n    }\n  ]\n}'
    },
    {
      category: 'Order Management',
      method: 'POST',
      path: '/api/portfolio/place-order',
      description: 'Place a single order',
      params: ['symbol', 'qty', 'side (BUY/SELL)', 'type (MARKET/LIMIT)', 'limitPrice (optional)'],
      example: '{\n  "symbol": "NSE:SBIN-EQ",\n  "qty": 10,\n  "side": "BUY",\n  "type": "LIMIT",\n  "limitPrice": 500\n}',
      response: '{\n  "status": "success",\n  "data": {\n    "order_id": "1234567",\n    "status": "OPEN"\n  }\n}'
    },
    {
      category: 'Order Management',
      method: 'POST',
      path: '/api/portfolio/place-basket-orders',
      description: 'Place multiple orders at once',
      params: ['orders (array)'],
      example: '{\n  "orders": [\n    {"symbol": "NSE:SBIN-EQ", "qty": 10, "side": "BUY"},\n    {"symbol": "NSE:TCS-EQ", "qty": 5, "side": "SELL"}\n  ]\n}',
      response: '{\n  "status": "success",\n  "data": {\n    "order_ids": ["1234567", "1234568"]\n  }\n}'
    },
    {
      category: 'Order Management',
      method: 'PUT',
      path: '/api/portfolio/modify-order',
      description: 'Modify an existing order',
      params: ['id', 'qty', 'limitPrice'],
      example: '{\n  "id": "1234567",\n  "qty": 20,\n  "limitPrice": 505\n}',
      response: '{\n  "status": "success",\n  "message": "Order modified"\n}'
    },
    {
      category: 'Order Management',
      method: 'DELETE',
      path: '/api/portfolio/cancel-order/{order_id}',
      description: 'Cancel an order',
      params: ['order_id (path)'],
      example: 'DELETE /api/portfolio/cancel-order/1234567',
      response: '{\n  "status": "success",\n  "message": "Order cancelled"\n}'
    },
    {
      category: 'Position Management',
      method: 'POST',
      path: '/api/portfolio/convert-position',
      description: 'Convert position type (INTRADAY ↔ CNC)',
      params: ['symbol', 'position_side', 'convert_from', 'convert_to'],
      example: '?symbol=NSE:SBIN-EQ&position_side=1&convert_from=INTRADAY&convert_to=CNC',
      response: '{\n  "status": "success",\n  "message": "Position converted"\n}'
    },
    {
      category: 'Position Management',
      method: 'POST',
      path: '/api/portfolio/exit-positions',
      description: 'Exit all or specific positions',
      params: ['position_id (optional)'],
      example: 'POST /api/portfolio/exit-positions?position_id=12345',
      response: '{\n  "status": "success",\n  "message": "Position closed"\n}'
    },
    {
      category: 'Market Status',
      method: 'GET',
      path: '/api/market/market-status',
      description: 'Get market open/close status for all exchanges',
      example: 'http://127.0.0.1:8001/api/market/market-status',
      response: '{\n  "status": "success",\n  "data": [\n    {\n      "exchange": "NSE",\n      "segment": "E",\n      "status": "OPEN"\n    }\n  ]\n}'
    },
    {
      category: 'WebSocket',
      method: 'WS',
      path: '/api/websocket/stream',
      description: 'Real-time market data streaming',
      params: ['symbols (subscribe/unsubscribe)'],
      example: '{\n  "action": "subscribe",\n  "symbols": ["NSE:SBIN-EQ", "NSE:TCS-EQ"],\n  "data_type": "SymbolUpdate"\n}',
      response: '{\n  "type": "SymbolUpdate",\n  "symbol": "NSE:SBIN-EQ",\n  "ltp": 500.50,\n  "volume": 1000000\n}'
    },
    {
      category: 'Order Stream',
      method: 'WS',
      path: '/api/order-stream/stream',
      description: 'Real-time order/trade/position updates',
      params: ['event_types (OnOrders/OnTrades/OnPositions/OnGeneral)'],
      example: '{\n  "action": "subscribe",\n  "event_types": ["OnOrders", "OnTrades"]\n}',
      response: '{\n  "type": "OnOrders",\n  "data": {\n    "id": "1234567",\n    "status": "COMPLETE",\n    "symbol": "NSE:SBIN-EQ"\n  }\n}'
    },
    {
      category: 'Order Stream',
      method: 'GET',
      path: '/api/order-stream/orders',
      description: 'Get all live orders',
      example: 'http://127.0.0.1:8001/api/order-stream/orders',
      response: '{\n  "status": "success",\n  "count": 5,\n  "data": [...]\n}'
    },
    {
      category: 'Order Stream',
      method: 'GET',
      path: '/api/order-stream/trades',
      description: 'Get all executed trades',
      example: 'http://127.0.0.1:8001/api/order-stream/trades',
      response: '{\n  "status": "success",\n  "count": 10,\n  "data": [...]\n}'
    },
  ];

  const categories = Array.from(new Set(endpoints.map(e => e.category)));

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const getMethodColor = (method: string) => {
    const colors: { [key: string]: string } = {
      GET: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      POST: 'bg-green-500/20 text-green-300 border-green-500/30',
      PUT: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      DELETE: 'bg-red-500/20 text-red-300 border-red-500/30',
      WS: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    };
    return colors[method] || 'bg-gray-500/20 text-gray-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-8">
      <div className="mx-auto w-full p-6">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">API Reference</h1>
          </div>
          <p className="text-gray-400 text-lg">
            44+ REST Endpoints + 2 WebSocket Streams for Complete Trading Control
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-blue-400 text-sm font-semibold">REST Endpoints</p>
            <p className="text-3xl font-bold text-white mt-2">44+</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <p className="text-purple-400 text-sm font-semibold">WebSocket Streams</p>
            <p className="text-3xl font-bold text-white mt-2">2</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-green-400 text-sm font-semibold">Categories</p>
            <p className="text-3xl font-bold text-white mt-2">{categories.length}</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <p className="text-orange-400 text-sm font-semibold">Data Fields</p>
            <p className="text-3xl font-bold text-white mt-2">100+</p>
          </div>
        </div>

        {/* Base URL */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-8">
          <p className="text-gray-400 text-sm mb-2">Base URL</p>
          <div className="flex items-center justify-between bg-zinc-950 p-3 rounded border border-zinc-800">
            <code className="text-blue-400 font-mono">http://127.0.0.1:8001</code>
            <button
              onClick={() => copyToClipboard('http://127.0.0.1:8001', 'baseurl')}
              className="p-2 hover:bg-zinc-800 rounded transition-colors"
            >
              {copied === 'baseurl' ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Endpoints by Category */}
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category} className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
              {/* Category Header */}
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-zinc-800 p-4">
                <h2 className="text-xl font-bold text-white">{category}</h2>
              </div>

              {/* Endpoints */}
              <div className="divide-y divide-zinc-800">
                {endpoints
                  .filter((e) => e.category === category)
                  .map((endpoint, idx) => {
                    const id = `${category}-${idx}`;
                    const isExpanded = expandedId === id;

                    return (
                      <div key={id} className="p-4">
                        {/* Endpoint Header */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? '' : id)}
                          className="w-full flex items-center justify-between hover:bg-zinc-800/30 -m-4 p-4 rounded transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <span
                              className={`px-3 py-1 rounded font-mono text-sm font-semibold border ${getMethodColor(
                                endpoint.method
                              )}`}
                            >
                              {endpoint.method}
                            </span>
                            <code className="text-gray-300 font-mono text-sm flex-1 text-left">
                              {endpoint.path}
                            </code>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        {/* Endpoint Details */}
                        {isExpanded && (
                          <div className="mt-4 ml-4 space-y-4 border-l-2 border-zinc-700 pl-4">
                            {/* Description */}
                            <div>
                              <p className="text-gray-400 text-sm mb-2">Description</p>
                              <p className="text-gray-300">{endpoint.description}</p>
                            </div>

                            {/* Parameters */}
                            {endpoint.params && endpoint.params.length > 0 && (
                              <div>
                                <p className="text-gray-400 text-sm mb-2">Parameters</p>
                                <ul className="space-y-1">
                                  {endpoint.params.map((param, i) => (
                                    <li key={i} className="text-gray-300 text-sm">
                                      • {param}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Example Request */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-gray-400 text-sm">Example Request</p>
                                <button
                                  onClick={() => copyToClipboard(endpoint.example, `req-${id}`)}
                                  className="p-1 hover:bg-zinc-700 rounded transition-colors"
                                >
                                  {copied === `req-${id}` ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                              </div>
                              <pre className="bg-zinc-950 border border-zinc-700 rounded p-3 text-gray-300 text-xs overflow-x-auto font-mono">
                                {endpoint.example}
                              </pre>
                            </div>

                            {/* Example Response */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-gray-400 text-sm">Example Response</p>
                                <button
                                  onClick={() => copyToClipboard(endpoint.response, `res-${id}`)}
                                  className="p-1 hover:bg-zinc-700 rounded transition-colors"
                                >
                                  {copied === `res-${id}` ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                              </div>
                              <pre className="bg-zinc-950 border border-zinc-700 rounded p-3 text-green-300 text-xs overflow-x-auto font-mono">
                                {endpoint.response}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p className="flex items-center justify-center gap-2">
            <Code2 className="w-4 h-4" />
            All endpoints return standardized JSON format with status & data fields
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiReference;
