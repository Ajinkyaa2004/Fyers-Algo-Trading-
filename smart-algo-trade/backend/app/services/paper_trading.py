import json
import os
from datetime import datetime
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

PAPER_TRADING_FILE = "data/paper_trading.json"


class PaperTradingService:
    """Manage paper (simulated) trading with virtual money"""

    def __init__(self, initial_capital: float = 10000):
        self.initial_capital = initial_capital
        self.data = self._load_data()

    def _load_data(self) -> Dict:
        """Load paper trading data from file"""
        try:
            if os.path.exists(PAPER_TRADING_FILE):
                with open(PAPER_TRADING_FILE, 'r') as f:
                    return json.load(f)
        except Exception as e:
            logger.warning(f"Could not load paper trading data: {e}")

        # Initialize new data
        return {
            "initial_capital": self.initial_capital,
            "cash": self.initial_capital,
            "positions": {},  # {symbol: {qty, avg_price, current_price, value}}
            "orders": [],  # List of all executed trades
            "trades": [],  # List of completed round-trip trades
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }

    def _save_data(self):
        """Save paper trading data to file"""
        try:
            os.makedirs(os.path.dirname(PAPER_TRADING_FILE), exist_ok=True)
            self.data["updated_at"] = datetime.now().isoformat()
            with open(PAPER_TRADING_FILE, 'w') as f:
                json.dump(self.data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving paper trading data: {e}")

    def place_order(
        self,
        symbol: str,
        quantity: int,
        price: float,
        side: str,  # BUY or SELL
        order_type: str = "LIMIT",
    ) -> Dict[str, Any]:
        """Place a paper trading order"""
        try:
            side = side.upper()
            if side not in ["BUY", "SELL"]:
                return {"success": False, "message": "Invalid side. Use BUY or SELL"}

            if quantity <= 0:
                return {"success": False, "message": "Quantity must be positive"}

            if price <= 0:
                return {"success": False, "message": "Price must be positive"}

            # Calculate order value
            order_value = quantity * price

            # Check if we have enough cash for BUY orders
            if side == "BUY":
                if self.data["cash"] < order_value:
                    return {
                        "success": False,
                        "message": f"Insufficient cash. Need ₹{order_value:,.2f}, have ₹{self.data['cash']:,.2f}",
                    }
                self.data["cash"] -= order_value
            else:  # SELL
                # Check if position exists
                if symbol not in self.data["positions"]:
                    return {
                        "success": False,
                        "message": f"No position in {symbol} to sell",
                    }

                position = self.data["positions"][symbol]
                if position["qty"] < quantity:
                    return {
                        "success": False,
                        "message": f"Cannot sell {quantity} units, you have {position['qty']} units",
                    }

            # Create order
            order = {
                "order_id": f"PAPER-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "symbol": symbol,
                "quantity": quantity,
                "price": price,
                "side": side,
                "type": order_type,
                "status": "COMPLETED",
                "timestamp": datetime.now().isoformat(),
                "value": order_value,
            }

            # Update positions
            if side == "BUY":
                if symbol not in self.data["positions"]:
                    self.data["positions"][symbol] = {
                        "qty": 0,
                        "avg_price": 0,
                        "current_price": price,
                        "value": 0,
                    }

                pos = self.data["positions"][symbol]
                total_cost = (pos["qty"] * pos["avg_price"]) + order_value
                pos["qty"] += quantity
                pos["avg_price"] = total_cost / pos["qty"] if pos["qty"] > 0 else 0
                pos["current_price"] = price
                pos["value"] = pos["qty"] * price

            else:  # SELL
                pos = self.data["positions"][symbol]
                pos["qty"] -= quantity

                if pos["qty"] == 0:
                    # Round-trip trade completed
                    pnl = (price - pos["avg_price"]) * quantity
                    pnl_percent = (pnl / (pos["avg_price"] * quantity)) * 100

                    trade = {
                        "symbol": symbol,
                        "entry_price": pos["avg_price"],
                        "exit_price": price,
                        "quantity": quantity,
                        "pnl": pnl,
                        "pnl_percent": pnl_percent,
                        "timestamp": datetime.now().isoformat(),
                    }
                    self.data["trades"].append(trade)
                    del self.data["positions"][symbol]
                else:
                    pos["current_price"] = price
                    pos["value"] = pos["qty"] * price

                self.data["cash"] += order_value

            self.data["orders"].append(order)
            self._save_data()

            return {
                "success": True,
                "message": f"Order executed successfully",
                "order": order,
                "cash_remaining": self.data["cash"],
            }

        except Exception as e:
            logger.error(f"Error placing paper trade: {e}")
            return {"success": False, "message": str(e)}

    def get_portfolio(self) -> Dict[str, Any]:
        """Get paper trading portfolio summary"""
        try:
            # Calculate total portfolio value
            positions_value = sum(
                p["value"] for p in self.data["positions"].values()
            )
            total_value = self.data["cash"] + positions_value

            # Calculate P&L
            realized_pnl = sum(t["pnl"] for t in self.data["trades"])
            unrealized_pnl = sum(
                (p["current_price"] - p["avg_price"]) * p["qty"]
                for p in self.data["positions"].values()
            )
            total_pnl = realized_pnl + unrealized_pnl

            return {
                "initial_capital": self.data["initial_capital"],
                "current_value": total_value,
                "cash": self.data["cash"],
                "positions_value": positions_value,
                "realized_pnl": realized_pnl,
                "unrealized_pnl": unrealized_pnl,
                "total_pnl": total_pnl,
                "return_percent": (
                    (total_pnl / self.data["initial_capital"]) * 100
                    if self.data["initial_capital"] > 0
                    else 0
                ),
                "positions": self.data["positions"],
                "open_positions_count": len(self.data["positions"]),
                "closed_trades": len(self.data["trades"]),
            }

        except Exception as e:
            logger.error(f"Error getting portfolio: {e}")
            return {}

    def get_orders(self, limit: int = 50) -> List[Dict]:
        """Get recent paper trading orders"""
        return sorted(
            self.data["orders"], key=lambda x: x["timestamp"], reverse=True
        )[:limit]

    def get_trades(self, limit: int = 50) -> List[Dict]:
        """Get closed trades/round-trips"""
        return sorted(
            self.data["trades"], key=lambda x: x["timestamp"], reverse=True
        )[:limit]

    def get_history(self) -> List[Dict]:
        """Get historical portfolio data"""
        trades = self.get_trades(limit=50)
        history = []
        
        current_portfolio_value = self.get_portfolio()["current_value"]
        
        for idx, trade in enumerate(trades):
            history.append({
                "date": trade.get("timestamp", datetime.now().isoformat()),
                "portfolio_value": current_portfolio_value - (idx * 100),  # Mock decreasing value
                "cash": self.data.get("cash", self.initial_capital),
                "positions_value": current_portfolio_value - self.data.get("cash", self.initial_capital),
                "pnl": trade.get("pnl", 0),
                "return_percent": (trade.get("pnl", 0) / self.initial_capital * 100) if self.initial_capital > 0 else 0,
                "open": 100 + idx,
                "high": 105 + idx,
                "low": 95 + idx,
                "close": 102 + idx,
                "time": trade.get("timestamp", datetime.now().isoformat()).split("T")[1][:5],
            })
        
        return history

    def get_stats(self) -> Dict[str, Any]:
        """Get trading statistics"""
        trades = self.get_trades(limit=1000)
        
        if not trades:
            return {
                "total_trades": 0,
                "winning_trades": 0,
                "losing_trades": 0,
                "win_rate": 0,
                "avg_win": 0,
                "avg_loss": 0,
                "max_drawdown": 0,
                "best_trade": 0,
                "worst_trade": 0,
            }
        
        winning_trades = [t for t in trades if t.get("pnl", 0) > 0]
        losing_trades = [t for t in trades if t.get("pnl", 0) <= 0]
        
        total_wins = sum(t.get("pnl", 0) for t in winning_trades)
        total_losses = sum(t.get("pnl", 0) for t in losing_trades)
        
        return {
            "total_trades": len(trades),
            "winning_trades": len(winning_trades),
            "losing_trades": len(losing_trades),
            "win_rate": (len(winning_trades) / len(trades) * 100) if trades else 0,
            "avg_win": (total_wins / len(winning_trades)) if winning_trades else 0,
            "avg_loss": (total_losses / len(losing_trades)) if losing_trades else 0,
            "max_drawdown": 0,
            "best_trade": max([t.get("pnl", 0) for t in trades]) if trades else 0,
            "worst_trade": min([t.get("pnl", 0) for t in trades]) if trades else 0,
        }

    def reset_portfolio(self) -> Dict[str, Any]:
        """Reset paper trading to initial state"""
        try:
            self.data = {
                "initial_capital": self.initial_capital,
                "cash": self.initial_capital,
                "positions": {},
                "orders": [],
                "trades": [],
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            }
            self._save_data()
            return {
                "success": True,
                "message": "Paper trading portfolio reset",
                "portfolio": self.get_portfolio(),
            }
        except Exception as e:
            logger.error(f"Error resetting portfolio: {e}")
            return {"success": False, "message": str(e)}

    def update_position_prices(self, price_data: Dict[str, float]) -> None:
        """Update current prices for all positions"""
        try:
            for symbol, price in price_data.items():
                if symbol in self.data["positions"]:
                    self.data["positions"][symbol]["current_price"] = price
                    self.data["positions"][symbol]["value"] = (
                        self.data["positions"][symbol]["qty"] * price
                    )
            self._save_data()
        except Exception as e:
            logger.error(f"Error updating position prices: {e}")


# Global instance
paper_trading_service = PaperTradingService(initial_capital=10000)
