# Smart Algo Trade - API Reference Guide

## Base URL
```
http://127.0.0.1:8001
```

## Authentication Endpoints

### 1. Get Login URL
```
GET /api/auth/login
Response: { "url": "https://api.fyers.in/api/v3/..." }
```

### 2. Process Auth Code
```
POST /api/auth/process-code
Body: { "code": "auth_code_from_fyers" }
Response: { "status": "success", "message": "Authentication successful" }
```

### 3. Check Auth Status
```
GET /api/auth/status
Response: {
  "is_authenticated": true,
  "user": { "name": "John Doe", "email": "john@example.com", ... }
}
```

### 4. Logout
```
POST /api/auth/logout
Response: { "status": "success", "message": "Logged out successfully" }
```

---

## Portfolio Data Endpoints

### Profile & Account

#### Get User Profile
```
GET /api/portfolio/profile
Response: { "status": "success", "data": { "name": "...", "email": "..." } }
```

#### Get Fund Status
```
GET /api/portfolio/funds
Response: { "status": "success", "data": { "used_margin": 0, "available_margin": 100000, ... } }
```

#### Get Margins
```
GET /api/portfolio/margins
Response: { "status": "success", "data": { ... } }
```

### Holdings & Positions

#### Get Holdings
```
GET /api/portfolio/holdings
Response: { 
  "status": "success", 
  "data": [
    { "symbol": "NSE:SBIN-EQ", "qty": 10, "avg_price": 500, "ltp": 520, ... }
  ] 
}
```

#### Get Open Positions
```
GET /api/portfolio/positions
Response: { 
  "status": "success", 
  "data": {
    "net": [ { "symbol": "NSE:IDEA-EQ", "qty": 5, "side": 1, ... } ],
    "day": []
  }
}
```

#### Get Orders
```
GET /api/portfolio/orders
Response: { 
  "status": "success", 
  "data": [
    { "id": "123456", "symbol": "NSE:SBIN-EQ", "qty": 1, "status": "COMPLETE", ... }
  ] 
}
```

#### Get GTT Orders
```
GET /api/portfolio/gtt
Response: { "status": "success", "data": [] }
```

---

## Market Data Endpoints

### Quotes
```
GET /api/portfolio/quotes?symbols=NSE:SBIN-EQ,NSE:IDEA-EQ

Response: {
  "status": "success",
  "data": {
    "NSE:SBIN-EQ": {
      "ltp": 520.50,
      "bid": 520.00,
      "ask": 521.00,
      "ltq": 100,
      "ltt": 1640000000
    },
    "NSE:IDEA-EQ": { ... }
  }
}
```

### Market Depth
```
GET /api/portfolio/depth?symbol=NSE:SBIN-EQ

Response: {
  "status": "success",
  "data": {
    "bid": [
      [520.00, 1000],
      [519.90, 500],
      [519.80, 250]
    ],
    "ask": [
      [521.00, 800],
      [521.10, 400],
      [521.20, 200]
    ]
  }
}
```

### Historical Data (Candles)
```
GET /api/portfolio/history?symbol=NSE:SBIN-EQ&resolution=D&range_from=1640000000&range_to=1645000000

Query Parameters:
- symbol: Trading symbol (NSE:SBIN-EQ)
- resolution: D|1|5|15|60|W|M (daily|1min|5min|15min|1hour|weekly|monthly)
- range_from: Unix timestamp (optional)
- range_to: Unix timestamp (optional)

Response: {
  "status": "success",
  "data": [
    { "t": 1640000000, "o": 500, "h": 525, "l": 495, "c": 520, "v": 1000000 },
    { "t": 1640086400, "o": 520, "h": 530, "l": 515, "c": 525, "v": 950000 }
  ]
}
```

### Symbol Search
```
GET /api/portfolio/search?query=SBIN

Response: {
  "status": "success",
  "data": [
    { "symbol": "NSE:SBIN-EQ", "name": "State Bank of India", ... },
    { "symbol": "NSE:SBIN-BE", "name": "State Bank of India", ... }
  ]
}
```

---

## Order Management Endpoints

### Place Single Order
```
POST /api/portfolio/place-order

Body: {
  "symbol": "NSE:SBIN-EQ",
  "qty": 1,
  "type": 2,                    # 1=Limit, 2=Market
  "side": 1,                    # 1=Buy, -1=Sell
  "productType": "INTRADAY",    # INTRADAY|DELIVERY|MTF
  "limitPrice": 0,              # Required if type=1
  "stopPrice": 0,
  "validity": "DAY",            # DAY|IOC
  "disclosedQty": 0,
  "offlineOrder": false
}

Response: {
  "status": "success",
  "data": { "id": "8102710298291", "status": "PENDING" }
}
```

### Place Multiple Orders (Basket)
```
POST /api/portfolio/place-basket-orders

Body: [
  { "symbol": "NSE:SBIN-EQ", "qty": 1, "type": 2, "side": 1, ... },
  { "symbol": "NSE:IDEA-EQ", "qty": 2, "type": 2, "side": -1, ... }
]

Response: {
  "status": "success",
  "data": {
    "success": [
      { "symbol": "NSE:SBIN-EQ", "orderId": "123" }
    ],
    "failure": []
  }
}
```

### Modify Order
```
PUT /api/portfolio/modify-order

Body: {
  "id": "8102710298291",
  "type": 1,                    # 1=Limit, 2=Market
  "limitPrice": 525,            # New price
  "qty": 2                       # New quantity
}

Response: {
  "status": "success",
  "data": { "id": "8102710298291", "status": "UPDATED" }
}
```

### Modify Multiple Orders
```
PUT /api/portfolio/modify-basket-orders

Body: [
  { "id": "123", "type": 1, "limitPrice": 525, "qty": 2 },
  { "id": "124", "type": 1, "limitPrice": 300, "qty": 1 }
]

Response: {
  "status": "success",
  "data": { "success": 2, "failure": 0 }
}
```

### Cancel Order
```
DELETE /api/portfolio/cancel-order/{orderId}

Example: DELETE /api/portfolio/cancel-order/8102710298291

Response: {
  "status": "success",
  "data": { "id": "8102710298291", "status": "CANCELLED" }
}
```

---

## Error Handling

All endpoints return consistent error responses:

```
HTTP 500 - Error Response:
{
  "detail": "Failed to fetch profile: Invalid session"
}
```

Common Error Messages:
- `"Invalid session"` - Session expired or invalid
- `"Failed to place order: Insufficient funds"` - Not enough margin
- `"Failed to place order: Invalid symbol"` - Symbol not found
- `"Failed to fetch data: Network error"` - Connection issue

---

## Frontend Usage Examples

### Fetch Quotes in React
```typescript
const fetchQuotes = async (symbols: string) => {
  const response = await fetch(`http://127.0.0.1:8001/api/portfolio/quotes?symbols=${symbols}`);
  const data = await response.json();
  return data.data;
};
```

### Place Order in React
```typescript
const placeOrder = async (orderData) => {
  const response = await fetch(
    'http://127.0.0.1:8001/api/portfolio/place-order',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    }
  );
  return await response.json();
};
```

### Fetch Historical Data
```typescript
const fetchHistory = async (symbol: string, resolution: string) => {
  const response = await fetch(
    `http://127.0.0.1:8001/api/portfolio/history?symbol=${symbol}&resolution=${resolution}`
  );
  return await response.json();
};
```

---

## Performance Notes

- All endpoints are protected by session authentication
- Market data endpoints cache responses (short TTL)
- Order endpoints execute immediately
- History data has maximum 365 days of data
- Symbol search is limited to 50 results
- Quotes support up to 100 symbols per request

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 401 | Unauthorized (not authenticated) |
| 500 | Server Error (Fyers API error) |

---

## Rate Limits

- API calls: 10 per second per session
- Historical data: 5 requests per second
- Order placement: 2 per second

**Last Updated:** December 25, 2025
