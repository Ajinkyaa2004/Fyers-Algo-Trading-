# Live Market Trading Engine
# Production-ready implementation for live market order execution
# Focus: Real-time price-based trading, P&L calculation, risk management

import asyncio
import time
from typing import Dict, List, Optional, Tuple, Callable
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================================
# DATA STRUCTURES
# ============================================================================

class OrderStatus(Enum):
    """Order execution states"""
    PENDING = "PENDING"
    EXECUTED = "EXECUTED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"


class OrderType(Enum):
    """Order types - only market orders for live execution"""
    MARKET_BUY = "MARKET_BUY"
    MARKET_SELL = "MARKET_SELL"


@dataclass
class PriceQuote:
    """Real-time price quote from market"""
    symbol: str
    bid_price: Decimal  # Highest price buyer willing to pay
    ask_price: Decimal  # Lowest price seller willing to accept
    last_price: Decimal  # Last traded price
    volume: int
    timestamp: datetime
    
    def mid_price(self) -> Decimal:
        """Calculate mid price between bid and ask"""
        return (self.bid_price + self.ask_price) / 2


@dataclass
class ExecutedOrder:
    """Record of executed market order"""
    order_id: str
    symbol: str
    order_type: OrderType
    quantity: int
    executed_price: Decimal  # Exact price order executed at
    executed_timestamp: datetime
    status: OrderStatus = OrderStatus.EXECUTED
    commission: Decimal = Decimal('0')  # Trading fee/commission
    
    @property
    def total_value(self) -> Decimal:
        """Total trade value: quantity × executed_price"""
        return Decimal(self.quantity) * self.executed_price


@dataclass
class Position:
    """Active trading position"""
    symbol: str
    quantity: int
    avg_buy_price: Decimal
    buy_orders: List[ExecutedOrder] = field(default_factory=list)
    sell_orders: List[ExecutedOrder] = field(default_factory=list)
    
    @property
    def total_cost(self) -> Decimal:
        """Total capital invested in this position"""
        return Decimal(self.quantity) * self.avg_buy_price
    
    def calculate_pnl(self, current_price: Decimal) -> Tuple[Decimal, Decimal]:
        """
        Calculate unrealized P&L
        
        Returns:
            (absolute_pnl, pnl_percentage)
        """
        if self.quantity == 0:
            return Decimal('0'), Decimal('0')
        
        unrealized_pnl = (current_price - self.avg_buy_price) * self.quantity
        pnl_percent = (unrealized_pnl / self.total_cost) * 100 if self.total_cost > 0 else Decimal('0')
        
        return unrealized_pnl, pnl_percent


@dataclass
class StopLossConfig:
    """Stop-loss configuration for a position"""
    symbol: str
    trigger_price: Decimal  # Price at which to execute stop-loss
    quantity: int  # Quantity to sell
    stop_type: str = "STOP_LOSS"  # STOP_LOSS or TAKE_PROFIT
    is_active: bool = True
    
    def is_triggered(self, current_price: Decimal) -> bool:
        """Check if stop condition is met"""
        return current_price <= self.trigger_price


@dataclass
class TakeProfileConfig:
    """Take-profit configuration for a position"""
    symbol: str
    trigger_price: Decimal  # Price at which to execute take-profit
    quantity: int  # Quantity to sell
    stop_type: str = "TAKE_PROFIT"
    is_active: bool = True
    
    def is_triggered(self, current_price: Decimal) -> bool:
        """Check if take-profit condition is met"""
        return current_price >= self.trigger_price


# ============================================================================
# PRICE STREAM MANAGER
# ============================================================================

class LivePriceStream:
    """
    Manages real-time price updates from market data source.
    Maintains current quotes for all trading symbols.
    
    Production note: Connect this to WebSocket (Fyers API) or polling service
    """
    
    def __init__(self):
        self._price_cache: Dict[str, PriceQuote] = {}
        self._subscribers: Dict[str, List[Callable]] = {}
        self._lock = asyncio.Lock()
        self._is_connected = False
    
    async def subscribe_to_symbol(self, symbol: str, callback: Callable) -> None:
        """
        Subscribe to price updates for a symbol
        
        Args:
            symbol: Trading symbol (e.g., 'NSE:SBIN-EQ')
            callback: Function to call on price update: callback(symbol, quote)
        """
        if symbol not in self._subscribers:
            self._subscribers[symbol] = []
        
        self._subscribers[symbol].append(callback)
        logger.info(f"Subscribed to {symbol}")
    
    async def update_price(self, symbol: str, quote: PriceQuote) -> None:
        """
        Update price quote and notify all subscribers
        
        Args:
            symbol: Trading symbol
            quote: Current price quote
        """
        async with self._lock:
            self._price_cache[symbol] = quote
        
        # Notify all subscribers of this symbol
        if symbol in self._subscribers:
            for callback in self._subscribers[symbol]:
                try:
                    await callback(symbol, quote) if asyncio.iscoroutinefunction(callback) else callback(symbol, quote)
                except Exception as e:
                    logger.error(f"Callback error for {symbol}: {e}")
    
    async def get_current_price(self, symbol: str) -> Optional[PriceQuote]:
        """
        Get latest price quote for symbol
        
        Args:
            symbol: Trading symbol
            
        Returns:
            PriceQuote or None if no data available
        """
        async with self._lock:
            return self._price_cache.get(symbol)
    
    def is_connected(self) -> bool:
        """Check if price stream is connected"""
        return self._is_connected
    
    async def connect_to_market_feed(self, data_source) -> None:
        """
        Connect to real-time market data source
        
        Production implementation: Connect to Fyers WebSocket API
        or polling service here
        """
        self._is_connected = True
        logger.info("Price stream connected to market feed")
    
    async def disconnect(self) -> None:
        """Disconnect from market data"""
        self._is_connected = False
        logger.info("Price stream disconnected")


# ============================================================================
# LIVE TRADING ENGINE
# ============================================================================

class LiveTradingEngine:
    """
    Core live market trading engine.
    Handles order execution, position tracking, and P&L calculations.
    
    Production architecture:
    - All price updates trigger execution checks
    - Orders execute at exact live price
    - Supports concurrent order processing
    - Maintains atomic transaction semantics
    """
    
    def __init__(self, wallet_balance: Decimal, price_stream: LivePriceStream):
        """
        Initialize trading engine
        
        Args:
            wallet_balance: Starting wallet balance (₹)
            price_stream: LivePriceStream instance for real-time prices
        """
        self._wallet_balance = wallet_balance
        self._initial_balance = wallet_balance
        self._price_stream = price_stream
        self._positions: Dict[str, Position] = {}
        self._order_history: List[ExecutedOrder] = []
        self._stop_losses: Dict[str, List[StopLossConfig]] = {}
        self._take_profits: Dict[str, List[TakeProfileConfig]] = {}
        self._order_counter = 0
        self._lock = asyncio.Lock()  # Prevent concurrent order conflicts
        self._commission_rate = Decimal('0.0005')  # 0.05% trading fee
        
        logger.info(f"Trading engine initialized with balance: ₹{self._wallet_balance}")
    
    # ========================================================================
    # BUY ORDER EXECUTION
    # ========================================================================
    
    async def market_buy(
        self,
        symbol: str,
        quantity: int,
        stop_loss_price: Optional[Decimal] = None,
        take_profit_price: Optional[Decimal] = None
    ) -> Tuple[bool, str, Optional[ExecutedOrder]]:
        """
        Execute market BUY order at current live price.
        
        Process:
        1. Validate symbol and get current price
        2. Check wallet has sufficient funds
        3. Calculate total cost with commission
        4. Execute order at live ask price
        5. Record position and order history
        6. Set stop-loss/take-profit if requested
        
        Args:
            symbol: Trading symbol (e.g., 'NSE:SBIN-EQ')
            quantity: Number of units to buy
            stop_loss_price: Optional stop-loss trigger price
            take_profit_price: Optional take-profit trigger price
        
        Returns:
            (success: bool, message: str, order: ExecutedOrder or None)
        
        Raises:
            ValueError: If order fails validation
        """
        async with self._lock:
            # Step 1: Get current market price
            price_quote = await self._price_stream.get_current_price(symbol)
            if not price_quote:
                msg = f"❌ Price feed unavailable for {symbol}"
                logger.warning(msg)
                return False, msg, None
            
            # Use ASK price for buying (seller's price)
            execution_price = price_quote.ask_price
            
            # Step 2: Calculate total cost including commission
            order_value = Decimal(quantity) * execution_price
            commission = order_value * self._commission_rate
            total_cost = order_value + commission
            
            # Step 3: Validate wallet balance
            if total_cost > self._wallet_balance:
                msg = (f"❌ Insufficient balance. Need: ₹{total_cost:.2f}, "
                       f"Available: ₹{self._wallet_balance:.2f}")
                logger.warning(msg)
                return False, msg, None
            
            # Step 4: Create order record
            self._order_counter += 1
            order = ExecutedOrder(
                order_id=f"BUY-{self._order_counter}",
                symbol=symbol,
                order_type=OrderType.MARKET_BUY,
                quantity=quantity,
                executed_price=execution_price,
                executed_timestamp=datetime.now(),
                commission=commission
            )
            
            # Step 5: Update wallet and position
            self._wallet_balance -= total_cost
            self._update_position_buy(symbol, quantity, execution_price)
            self._order_history.append(order)
            
            # Step 6: Set risk management orders
            if stop_loss_price:
                self._set_stop_loss(symbol, stop_loss_price, quantity)
            if take_profit_price:
                self._set_take_profit(symbol, take_profit_price, quantity)
            
            msg = (f"✅ BUY EXECUTED: {quantity} {symbol} @ ₹{execution_price:.2f} "
                   f"(Total: ₹{order_value:.2f} + Commission: ₹{commission:.2f})")
            logger.info(msg)
            
            return True, msg, order
    
    # ========================================================================
    # SELL ORDER EXECUTION
    # ========================================================================
    
    async def market_sell(
        self,
        symbol: str,
        quantity: int
    ) -> Tuple[bool, str, Optional[ExecutedOrder]]:
        """
        Execute market SELL order at current live price.
        
        Process:
        1. Validate symbol and get current price
        2. Check sufficient position quantity
        3. Execute order at live bid price
        4. Calculate realized P&L
        5. Credit wallet with proceeds
        6. Record transaction
        
        Args:
            symbol: Trading symbol
            quantity: Number of units to sell
        
        Returns:
            (success: bool, message: str, order: ExecutedOrder or None)
        
        Raises:
            ValueError: If position or price unavailable
        """
        async with self._lock:
            # Step 1: Get current market price
            price_quote = await self._price_stream.get_current_price(symbol)
            if not price_quote:
                msg = f"❌ Price feed unavailable for {symbol}"
                logger.warning(msg)
                return False, msg, None
            
            # Use BID price for selling (buyer's price)
            execution_price = price_quote.bid_price
            
            # Step 2: Validate position exists and has sufficient quantity
            if symbol not in self._positions:
                msg = f"❌ No position in {symbol} to sell"
                logger.warning(msg)
                return False, msg, None
            
            position = self._positions[symbol]
            if position.quantity < quantity:
                msg = (f"❌ Insufficient quantity. Have: {position.quantity}, "
                       f"Want to sell: {quantity}")
                logger.warning(msg)
                return False, msg, None
            
            # Step 3: Calculate proceeds and commission
            order_value = Decimal(quantity) * execution_price
            commission = order_value * self._commission_rate
            proceeds = order_value - commission
            
            # Step 4: Calculate realized P&L
            cost_basis = Decimal(quantity) * position.avg_buy_price
            realized_pnl = order_value - cost_basis - commission
            pnl_percent = (realized_pnl / cost_basis * 100) if cost_basis > 0 else Decimal('0')
            
            # Step 5: Create order record
            self._order_counter += 1
            order = ExecutedOrder(
                order_id=f"SELL-{self._order_counter}",
                symbol=symbol,
                order_type=OrderType.MARKET_SELL,
                quantity=quantity,
                executed_price=execution_price,
                executed_timestamp=datetime.now(),
                commission=commission
            )
            
            # Step 6: Update wallet and position
            self._wallet_balance += proceeds
            self._update_position_sell(symbol, quantity, execution_price)
            self._order_history.append(order)
            position.sell_orders.append(order)
            
            msg = (f"✅ SELL EXECUTED: {quantity} {symbol} @ ₹{execution_price:.2f} "
                   f"| Proceeds: ₹{proceeds:.2f} | "
                   f"P&L: ₹{realized_pnl:.2f} ({pnl_percent:.2f}%)")
            logger.info(msg)
            
            return True, msg, order
    
    # ========================================================================
    # POSITION MANAGEMENT
    # ========================================================================
    
    def _update_position_buy(
        self,
        symbol: str,
        quantity: int,
        price: Decimal
    ) -> None:
        """
        Update position after BUY order.
        Recalculate average buy price.
        """
        if symbol not in self._positions:
            self._positions[symbol] = Position(
                symbol=symbol,
                quantity=quantity,
                avg_buy_price=price,
                buy_orders=[],
                sell_orders=[]
            )
        else:
            pos = self._positions[symbol]
            # Recalculate average buy price
            total_cost = (pos.quantity * pos.avg_buy_price) + (quantity * price)
            pos.quantity += quantity
            pos.avg_buy_price = total_cost / pos.quantity if pos.quantity > 0 else Decimal('0')
    
    def _update_position_sell(
        self,
        symbol: str,
        quantity: int,
        price: Decimal
    ) -> None:
        """
        Update position after SELL order.
        Reduce quantity.
        """
        if symbol in self._positions:
            pos = self._positions[symbol]
            pos.quantity -= quantity
            
            # Close position if quantity reaches zero
            if pos.quantity == 0:
                del self._positions[symbol]
                logger.info(f"Position in {symbol} closed (quantity: 0)")
    
    # ========================================================================
    # RISK MANAGEMENT: STOP-LOSS / TAKE-PROFIT
    # ========================================================================
    
    def _set_stop_loss(
        self,
        symbol: str,
        trigger_price: Decimal,
        quantity: int
    ) -> None:
        """Set stop-loss order for position"""
        if symbol not in self._stop_losses:
            self._stop_losses[symbol] = []
        
        stop_loss = StopLossConfig(
            symbol=symbol,
            trigger_price=trigger_price,
            quantity=quantity
        )
        self._stop_losses[symbol].append(stop_loss)
        logger.info(f"Stop-loss set for {symbol} at ₹{trigger_price}")
    
    def _set_take_profit(
        self,
        symbol: str,
        trigger_price: Decimal,
        quantity: int
    ) -> None:
        """Set take-profit order for position"""
        if symbol not in self._take_profits:
            self._take_profits[symbol] = []
        
        take_profit = TakeProfileConfig(
            symbol=symbol,
            trigger_price=trigger_price,
            quantity=quantity
        )
        self._take_profits[symbol].append(take_profit)
        logger.info(f"Take-profit set for {symbol} at ₹{trigger_price}")
    
    async def check_risk_orders(self, symbol: str, current_price: Decimal) -> None:
        """
        Monitor and execute stop-loss/take-profit orders.
        Called on every price update.
        
        Process:
        1. Check all stop-losses for symbol
        2. Check all take-profits for symbol
        3. Auto-execute SELL if triggered
        4. Remove order after execution
        """
        # Check stop-losses
        if symbol in self._stop_losses:
            stop_losses = self._stop_losses[symbol][:]
            for sl in stop_losses:
                if sl.is_active and sl.is_triggered(current_price):
                    logger.warning(f"🛑 STOP-LOSS triggered for {symbol} at ₹{current_price}")
                    success, msg, _ = await self.market_sell(symbol, sl.quantity)
                    if success:
                        sl.is_active = False
                        self._stop_losses[symbol].remove(sl)
        
        # Check take-profits
        if symbol in self._take_profits:
            take_profits = self._take_profits[symbol][:]
            for tp in take_profits:
                if tp.is_active and tp.is_triggered(current_price):
                    logger.info(f"🎯 TAKE-PROFIT triggered for {symbol} at ₹{current_price}")
                    success, msg, _ = await self.market_sell(symbol, tp.quantity)
                    if success:
                        tp.is_active = False
                        self._take_profits[symbol].remove(tp)
    
    # ========================================================================
    # P&L CALCULATIONS
    # ========================================================================
    
    async def get_portfolio_pnl(self) -> Dict:
        """
        Calculate total portfolio P&L.
        
        Returns:
            {
                'total_realized_pnl': float,      # From closed trades
                'total_unrealized_pnl': float,    # From open positions
                'total_pnl': float,               # Realized + Unrealized
                'total_pnl_percent': float,
                'positions': {...}                # Per-symbol breakdown
            }
        """
        total_realized_pnl = Decimal('0')
        total_unrealized_pnl = Decimal('0')
        
        # Calculate realized P&L from closed trades
        for order in self._order_history:
            if order.order_type == OrderType.MARKET_SELL:
                # Find matching buy order for this symbol
                buy_orders = [o for o in self._order_history 
                              if o.symbol == order.symbol and 
                              o.order_type == OrderType.MARKET_BUY]
                if buy_orders:
                    avg_buy_price = sum(o.executed_price * o.quantity for o in buy_orders) / sum(o.quantity for o in buy_orders)
                    pnl = (order.executed_price - avg_buy_price) * order.quantity - order.commission
                    total_realized_pnl += pnl
        
        # Calculate unrealized P&L from open positions
        positions_detail = {}
        for symbol, position in self._positions.items():
            price_quote = await self._price_stream.get_current_price(symbol)
            if price_quote:
                current_price = price_quote.last_price
                unrealized_pnl, unrealized_pnl_percent = position.calculate_pnl(current_price)
                total_unrealized_pnl += unrealized_pnl
                
                positions_detail[symbol] = {
                    'quantity': position.quantity,
                    'avg_buy_price': float(position.avg_buy_price),
                    'current_price': float(current_price),
                    'unrealized_pnl': float(unrealized_pnl),
                    'unrealized_pnl_percent': float(unrealized_pnl_percent)
                }
        
        total_pnl = total_realized_pnl + total_unrealized_pnl
        total_pnl_percent = (total_pnl / self._initial_balance * 100) if self._initial_balance > 0 else Decimal('0')
        
        return {
            'wallet_balance': float(self._wallet_balance),
            'total_realized_pnl': float(total_realized_pnl),
            'total_unrealized_pnl': float(total_unrealized_pnl),
            'total_pnl': float(total_pnl),
            'total_pnl_percent': float(total_pnl_percent),
            'positions': positions_detail,
            'active_positions_count': len(self._positions),
            'order_count': len(self._order_history),
            'portfolio_value': float(self._wallet_balance + total_unrealized_pnl)
        }
    
    # ========================================================================
    # REPORTING & DIAGNOSTICS
    # ========================================================================
    
    def get_order_history(self, symbol: Optional[str] = None) -> List[Dict]:
        """Get execution history, optionally filtered by symbol"""
        orders = self._order_history
        if symbol:
            orders = [o for o in orders if o.symbol == symbol]
        
        return [
            {
                'order_id': o.order_id,
                'symbol': o.symbol,
                'type': o.order_type.value,
                'quantity': o.quantity,
                'executed_price': float(o.executed_price),
                'timestamp': o.executed_timestamp.isoformat(),
                'commission': float(o.commission),
                'status': o.status.value
            }
            for o in orders
        ]
    
    def get_active_positions(self) -> List[Dict]:
        """Get all active positions"""
        return [
            {
                'symbol': pos.symbol,
                'quantity': pos.quantity,
                'avg_buy_price': float(pos.avg_buy_price),
                'total_cost': float(pos.total_cost)
            }
            for pos in self._positions.values()
        ]
    
    def get_risk_orders(self) -> Dict:
        """Get all active stop-losses and take-profits"""
        return {
            'stop_losses': {
                symbol: [
                    {
                        'trigger_price': float(sl.trigger_price),
                        'quantity': sl.quantity
                    }
                    for sl in orders
                ]
                for symbol, orders in self._stop_losses.items()
            },
            'take_profits': {
                symbol: [
                    {
                        'trigger_price': float(tp.trigger_price),
                        'quantity': tp.quantity
                    }
                    for tp in orders
                ]
                for symbol, orders in self._take_profits.items()
            }
        }


# ============================================================================
# PRICE UPDATE HANDLER (Integration point)
# ============================================================================

async def on_price_update(
    trading_engine: LiveTradingEngine,
    symbol: str,
    quote: PriceQuote
) -> None:
    """
    Called whenever price updates from market feed.
    
    This is the main integration point for real-time execution.
    Every price tick triggers:
    1. Risk order checks (stop-loss/take-profit)
    2. Potential auto-execution
    
    Production: Wire this to WebSocket callbacks from Fyers API
    """
    await trading_engine.check_risk_orders(symbol, quote.last_price)


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

async def example_trading_session():
    """
    Example: Complete trading session with live orders.
    
    Demonstrates:
    - Engine initialization
    - Market buy execution
    - Real-time price monitoring
    - Stop-loss triggers
    - P&L calculation
    """
    # Initialize price stream (connect to market data)
    price_stream = LivePriceStream()
    await price_stream.connect_to_market_feed(None)  # Connect to real source
    
    # Initialize trading engine with wallet balance
    engine = LiveTradingEngine(
        wallet_balance=Decimal('500000'),  # ₹5,00,000
        price_stream=price_stream
    )
    
    # Subscribe to price updates
    await price_stream.subscribe_to_symbol(
        "NSE:SBIN-EQ",
        lambda s, q: asyncio.create_task(on_price_update(engine, s, q))
    )
    
    # Simulate receiving live price quote
    quote = PriceQuote(
        symbol="NSE:SBIN-EQ",
        bid_price=Decimal('549.50'),
        ask_price=Decimal('550.00'),
        last_price=Decimal('549.75'),
        volume=100000,
        timestamp=datetime.now()
    )
    await price_stream.update_price("NSE:SBIN-EQ", quote)
    
    # Execute market buy order with stop-loss and take-profit
    success, msg, order = await engine.market_buy(
        symbol="NSE:SBIN-EQ",
        quantity=100,
        stop_loss_price=Decimal('545.00'),   # Auto-sell if price drops
        take_profit_price=Decimal('560.00')  # Auto-sell if price rises
    )
    print(msg)
    
    # Simulate price update triggering take-profit
    await asyncio.sleep(1)
    quote_tp = PriceQuote(
        symbol="NSE:SBIN-EQ",
        bid_price=Decimal('560.50'),
        ask_price=Decimal('561.00'),
        last_price=Decimal('560.75'),
        volume=150000,
        timestamp=datetime.now()
    )
    await price_stream.update_price("NSE:SBIN-EQ", quote_tp)
    
    # Get P&L summary
    pnl = await engine.get_portfolio_pnl()
    print(f"\n📊 Portfolio Summary:")
    print(f"   Wallet: ₹{pnl['wallet_balance']:.2f}")
    print(f"   Total P&L: ₹{pnl['total_pnl']:.2f} ({pnl['total_pnl_percent']:.2f}%)")


if __name__ == "__main__":
    # Run example session
    asyncio.run(example_trading_session())
