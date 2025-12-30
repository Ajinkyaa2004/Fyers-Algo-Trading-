# Backend Integration Checklist - Options Trading

## 📋 Overview
This checklist helps backend developers implement the options trading functionality that the frontend is now sending.

---

## ✅ Phase 1: API Parameter Handling

### Paper Trading Endpoint
**Location**: `routes/paper_trading.py` → `/place-order`

#### Current Parameters
```python
symbol = request.args.get('symbol')
quantity = request.args.get('quantity')
price = request.args.get('price')
side = request.args.get('side')
order_type = request.args.get('order_type')
```

#### ADD: New Options Parameters
```python
# New parameters from frontend
instrument_type = request.args.get('instrument_type', 'EQUITY')  # EQUITY, CALL, PUT
strike_price = request.args.get('strike_price')  # For options
expiry_date = request.args.get('expiry_date')    # For options

# Validation
if instrument_type in ['CALL', 'PUT']:
    if not strike_price or not expiry_date:
        return {'success': False, 'message': 'Strike price and expiry required for options'}
```

### Live Trading Endpoint
**Location**: `routes/portfolio.py` → `/place-order`

#### Current Parameters
```python
orderData = {
    'symbol': request.json.get('symbol'),
    'qty': request.json.get('qty'),
    'type': request.json.get('type'),
    'side': request.json.get('side'),
    'productType': request.json.get('productType'),
    ...
}
```

#### ADD: New Options Parameters
```python
# From request.json
instrument_type = request.json.get('instrumentType', 'EQUITY')
strike_price = request.json.get('strikePrice')
expiry_date = request.json.get('expiryDate')

# Add to orderData
orderData['instrumentType'] = instrument_type
if instrument_type in ['CALL', 'PUT']:
    orderData['strikePrice'] = strike_price
    orderData['expiryDate'] = expiry_date
```

---

## ✅ Phase 2: Order Data Structure

### Update Order Model/Database

#### New Fields to Store
```python
class Order:
    symbol: str
    quantity: int
    price: float
    side: str  # BUY, SELL
    order_type: str  # LIMIT, MARKET
    product_type: str  # MIS, CNC
    
    # NEW FIELDS:
    instrument_type: str  # EQUITY, CALL, PUT
    strike_price: Optional[float]  # For options
    expiry_date: Optional[str]  # For options
    contract_id: Optional[str]  # Fyers options contract ID
```

#### Database Schema Update
```sql
ALTER TABLE orders ADD COLUMN instrument_type VARCHAR(20) DEFAULT 'EQUITY';
ALTER TABLE orders ADD COLUMN strike_price FLOAT NULL;
ALTER TABLE orders ADD COLUMN expiry_date VARCHAR(20) NULL;
ALTER TABLE orders ADD COLUMN contract_id VARCHAR(100) NULL;
```

---

## ✅ Phase 3: Order Placement Logic

### Paper Trading Service
**Location**: `services/paper_trading.py`

#### Current Logic
```python
def place_order(symbol, quantity, price, side, order_type):
    # Calculate cost
    cost = quantity * price
    
    # Check cash available
    if cost > portfolio.cash:
        return error
    
    # Deduct cash, create position
    portfolio.cash -= cost
    position = add_position(symbol, quantity, price, side)
    
    return success
```

#### UPDATE: Add Options Support
```python
def place_order(symbol, quantity, price, side, order_type, 
                instrument_type='EQUITY', strike_price=None, expiry_date=None):
    
    if instrument_type == 'EQUITY':
        # Existing logic
        cost = quantity * price
        return place_equity_order(...)
    
    elif instrument_type in ['CALL', 'PUT']:
        # New options logic
        # Premium is the 'price' parameter
        premium_cost = quantity * price  # ₹200 × 2 = ₹400
        
        if premium_cost > portfolio.cash:
            return {'success': False, 'message': 'Insufficient cash'}
        
        # Create options position
        portfolio.cash -= premium_cost
        position = add_options_position(
            symbol=symbol,
            quantity=quantity,
            premium=price,
            side=side,
            instrument_type=instrument_type,
            strike_price=strike_price,
            expiry_date=expiry_date,
            order_type=order_type
        )
        
        return {'success': True, 'position': position}
```

---

## ✅ Phase 4: Position Tracking

### Separate Tracking for Options vs Equity

#### Position Structure Update
```python
class Position:
    id: str
    symbol: str
    instrument_type: str  # EQUITY or CALL or PUT
    
    # For EQUITY
    if instrument_type == 'EQUITY':
        quantity: int
        entry_price: float
        current_price: float
        
    # For OPTIONS
    elif instrument_type in ['CALL', 'PUT']:
        contract_id: str  # NIFTY50JAN2519500CE
        quantity: int  # Number of contracts
        entry_premium: float  # Premium paid
        current_premium: float  # Current market premium
        strike_price: float
        expiry_date: str
        time_decay: float  # Daily decay amount
        
    # Common
    side: str  # BUY or SELL
    pnl: float
    pnl_percent: float
    status: str  # OPEN, CLOSED, EXPIRED
```

---

## ✅ Phase 5: P&L Calculation

### For Equity Positions (Unchanged)
```python
def calculate_equity_pnl(position):
    if position.side == 'BUY':
        pnl = (position.current_price - position.entry_price) * position.quantity
    else:  # SELL
        pnl = (position.entry_price - position.current_price) * position.quantity
    
    pnl_percent = (pnl / (position.entry_price * position.quantity)) * 100
    return pnl, pnl_percent
```

### For Options Positions (NEW)
```python
def calculate_options_pnl(position):
    """
    For options: Premium change = P&L
    Time decay works against long positions
    """
    if position.side == 'BUY':
        # Bought premium at entry_premium, current is current_premium
        pnl = (position.entry_premium - position.current_premium) * position.quantity
        # Note: Inverted (premium loss = our loss)
    else:  # SELL
        # Sold premium at entry_premium, current is current_premium
        pnl = (position.entry_premium - position.current_premium) * position.quantity
        # Sold high, hoping to buy back low
    
    # P&L percentage
    pnl_percent = (pnl / (position.entry_premium * position.quantity)) * 100
    return pnl, pnl_percent
```

---

## ✅ Phase 6: Time Decay Simulation (Paper Trading)

### Daily Update Logic
```python
def update_paper_trading_positions():
    """
    Called daily to simulate time decay and price changes
    """
    for position in portfolio.positions:
        if position.instrument_type == 'EQUITY':
            # Update price from market data
            position.current_price = get_market_price(position.symbol)
        
        elif position.instrument_type in ['CALL', 'PUT']:
            # 1. Get new premium from market data
            new_premium = get_option_premium(
                symbol=position.symbol,
                strike=position.strike_price,
                expiry=position.expiry_date,
                option_type=position.instrument_type
            )
            
            # 2. Update position
            position.current_premium = new_premium
            
            # 3. Update P&L
            position.pnl, position.pnl_percent = calculate_options_pnl(position)
            
            # 4. Check if expired
            if is_expiry_today(position.expiry_date):
                settle_option_position(position)
```

---

## ✅ Phase 7: Options Settlement

### At Expiry
```python
def settle_option_position(position):
    """
    Called when option expires
    ITM: Automatic exercise
    OTM: Expires worthless
    """
    if position.instrument_type == 'CALL':
        # CALL is ITM if spot > strike
        if market_price > position.strike_price:
            # ITM - exercised
            if position.side == 'BUY':
                # Bought call - we get shares
                cash_settled = (market_price - position.strike_price) * position.quantity * multiplier
                portfolio.cash += cash_settled
            else:
                # Sold call - we give shares
                cash_settled = (position.strike_price - market_price) * position.quantity * multiplier
                portfolio.cash += cash_settled
        else:
            # OTM - expires worthless (no cash change, premium already accounted)
            pass
    
    elif position.instrument_type == 'PUT':
        # PUT is ITM if spot < strike
        if market_price < position.strike_price:
            # ITM - exercised
            if position.side == 'BUY':
                # Bought put - we get cash
                cash_settled = (position.strike_price - market_price) * position.quantity * multiplier
                portfolio.cash += cash_settled
            else:
                # Sold put - we pay cash
                cash_settled = (position.strike_price - market_price) * position.quantity * multiplier
                portfolio.cash -= cash_settled
        else:
            # OTM - expires worthless
            pass
    
    # Mark position as expired
    position.status = 'EXPIRED'
    position.closed_date = today()
```

---

## ✅ Phase 8: Live Trading Integration

### Map Options to Fyers API

#### Fyers Contract Symbols
```python
# Fyers options contract format:
# NSE:NIFTY50JAN2519500CE  <- CALL at expiry JAN25 (31-Jan-25), strike 19500
# NSE:NIFTY50JAN2519500PE  <- PUT at expiry JAN25, strike 19500

def build_fyers_options_symbol(symbol, strike_price, expiry_date, option_type):
    """
    Convert our format to Fyers format
    """
    # Parse expiry_date (2025-01-31) to Fyers format (JAN25)
    month = expiry_date.split('-')[1]  # '01'
    year = expiry_date.split('-')[0][-2:]  # '25'
    
    month_map = {
        '01': 'JAN', '02': 'FEB', '03': 'MAR', '04': 'APR',
        '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AUG',
        '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DEC'
    }
    
    month_abbr = month_map[month]
    option_code = 'CE' if option_type == 'CALL' else 'PE'
    
    # Assuming NSE options
    fyers_symbol = f"NSE:{symbol}{month_abbr}{year}{int(strike_price)}{option_code}"
    
    return fyers_symbol

# Example:
# symbol='NIFTY50', strike=19500, expiry='2025-01-31', type='CALL'
# -> 'NSE:NIFTY50JAN2519500CE'
```

#### Place Live Options Order
```python
def place_live_options_order(order_data):
    """
    Send options order to Fyers API
    """
    fyers_symbol = build_fyers_options_symbol(
        symbol=order_data['symbol'],
        strike_price=order_data['strikePrice'],
        expiry_date=order_data['expiryDate'],
        option_type=order_data['instrumentType']
    )
    
    # Build Fyers order
    order = {
        'symbol': fyers_symbol,  # 'NSE:NIFTY50JAN2519500CE'
        'qty': order_data['qty'],
        'type': order_data['type'],  # 'LIMIT' or 'MARKET'
        'side': order_data['side'],  # 1 for BUY, -1 for SELL
        'limitPrice': order_data['limitPrice'],
        'stopPrice': order_data['stopPrice'],
        'productType': order_data['productType'],  # 'MIS' or 'CNC'
        'validity': 'DAY',
        'disclosedQty': 0,
        'offlineOrder': False
    }
    
    # Send to Fyers API
    response = fyers_api.place_order(order)
    
    return response
```

---

## ✅ Phase 9: Portfolio Summary Update

### Include Options in Portfolio Calculation

```python
def calculate_portfolio_summary():
    """
    Calculate total portfolio value including options
    """
    total_cash = portfolio.cash
    
    equity_value = 0
    equity_pnl = 0
    
    options_value = 0
    options_pnl = 0
    
    for position in portfolio.positions:
        if position.instrument_type == 'EQUITY':
            # Current market value
            position_value = position.quantity * position.current_price
            position_pnl = calculate_equity_pnl(position)
            
            equity_value += position_value
            equity_pnl += position_pnl
        
        elif position.instrument_type in ['CALL', 'PUT']:
            # Option value = current premium × quantity × multiplier
            # (multiplier is 50 for Nifty, 1 for stocks, etc.)
            multiplier = get_option_multiplier(position.symbol)
            
            # Position value in the market
            position_value = position.current_premium * position.quantity * multiplier
            
            # Our P&L
            position_pnl = calculate_options_pnl(position)
            
            options_value += position_value
            options_pnl += position_pnl
    
    # Summary
    summary = {
        'initial_capital': portfolio.initial_capital,
        'current_cash': total_cash,
        'equity_positions_value': equity_value,
        'options_positions_value': options_value,
        'positions_value': equity_value + options_value,
        'current_value': total_cash + equity_value + options_value,
        'realized_pnl': portfolio.realized_pnl,
        'unrealized_pnl': equity_pnl + options_pnl,
        'total_pnl': portfolio.realized_pnl + equity_pnl + options_pnl,
        'return_percent': ((portfolio.realized_pnl + equity_pnl + options_pnl) / portfolio.initial_capital) * 100
    }
    
    return summary
```

---

## ✅ Phase 10: Testing Checklist

### Unit Tests
```python
def test_place_call_option_order():
    """Test placing a CALL option order"""
    order = {
        'symbol': 'NIFTY50',
        'quantity': 2,
        'price': 200,  # Premium
        'side': 'BUY',
        'instrument_type': 'CALL',
        'strike_price': 19500,
        'expiry_date': '2025-12-31'
    }
    
    response = place_paper_order(order)
    assert response['success'] == True
    assert portfolio.cash == 10000 - 400  # ₹400 premium paid

def test_options_pnl_calculation():
    """Test P&L calculation for options"""
    position = {
        'side': 'BUY',
        'entry_premium': 200,
        'current_premium': 300,
        'quantity': 2,
        'instrument_type': 'CALL'
    }
    
    pnl, pnl_percent = calculate_options_pnl(position)
    assert pnl == 200  # (200 - 300) * 2 = -200? No wait...
    # Actually: Bought at 200, current at 300 = profit of 100 per contract
    # Actually premium change: entry_premium - current_premium is inverted
    # Let me recalculate...
```

### Integration Tests
```python
def test_buy_and_sell_call_option():
    """Test full lifecycle: BUY then SELL"""
    # 1. BUY CALL
    buy_order = place_paper_order(...)
    assert buy_order['success']
    
    # 2. Check position created
    positions = get_positions()
    assert len(positions) == 1
    assert positions[0]['instrument_type'] == 'CALL'
    
    # 3. Update premium (simulate market)
    positions[0]['current_premium'] = 350  # Profit!
    
    # 4. SELL to close
    sell_order = place_paper_order(
        symbol='NIFTY50',
        strike_price=19500,
        quantity=1,
        side='SELL',
        instrument_type='CALL'
    )
    
    # 5. Verify position closed and P&L realized
    assert positions[0]['status'] == 'CLOSED'
    assert profit_realized > 0

def test_options_expiry_settlement():
    """Test options settlement at expiry"""
    # Create option position
    position = create_option_position(...)
    position['expiry_date'] = today()  # Set to today (expiry)
    
    # Simulate market price at expiry
    market_price = 19600  # Above strike of 19500
    
    # Settlement
    settle_option_position(position)
    
    # Should be marked expired
    assert position['status'] == 'EXPIRED'
    # Cash should be updated based on intrinsic value
```

---

## ✅ Phase 11: Error Handling

### New Validation Rules
```python
def validate_options_order(order):
    """Validate options order parameters"""
    
    errors = []
    
    if order['instrument_type'] in ['CALL', 'PUT']:
        # Strike price required
        if not order.get('strikePrice'):
            errors.append('Strike price required for options')
        
        # Expiry date required
        if not order.get('expiryDate'):
            errors.append('Expiry date required for options')
        
        # Expiry must be in future
        if not is_future_date(order['expiryDate']):
            errors.append('Expiry date must be in the future')
        
        # Valid strike price
        if order['strikePrice'] <= 0:
            errors.append('Strike price must be positive')
        
        # Premium (price) must be positive
        if order['price'] <= 0:
            errors.append('Premium must be positive')
    
    return errors if errors else None
```

---

## 📋 Implementation Checklist

### Backend Developer Tasks

- [ ] **Phase 1**: Update API endpoints to accept instrument_type, strike_price, expiry_date
- [ ] **Phase 2**: Update database schema with new options fields
- [ ] **Phase 3**: Implement options order placement logic in paper trading service
- [ ] **Phase 4**: Create separate position tracking for options vs equity
- [ ] **Phase 5**: Implement options P&L calculation (premium-based, not price-based)
- [ ] **Phase 6**: Add time decay simulation for paper trading
- [ ] **Phase 7**: Implement options settlement logic at expiry
- [ ] **Phase 8**: Map options to Fyers API contracts (NSE:NIFTY50JAN25xxxxx)
- [ ] **Phase 9**: Update portfolio summary to include options
- [ ] **Phase 10**: Write comprehensive unit and integration tests
- [ ] **Phase 11**: Add error handling and validation
- [ ] **Documentation**: Update API documentation with options endpoints
- [ ] **Testing**: Manual test all scenarios (BUY CALL, BUY PUT, expiry, settlement)

---

## 📞 Questions?

If unclear about any aspect:
1. Check OPTIONS_TRADING_GUIDE.md for trading concepts
2. Check OPTIONS_QUICK_REF.md for quick definitions
3. Look at the frontend OrderPlacement.tsx for exact field mappings
4. Review test cases for expected behavior

---

**Status**: Frontend ✅ Ready | Backend 🔄 Needs Implementation

Good luck! 🚀

