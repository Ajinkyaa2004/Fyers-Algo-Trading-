from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    """User model for storing user session data."""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    access_token = Column(String)
    refresh_token = Column(String, nullable=True)
    token_expiry = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    portfolios = relationship("Portfolio", back_populates="user")
    strategies = relationship("Strategy", back_populates="user")
    trades = relationship("Trade", back_populates="user")

class Portfolio(Base):
    """Portfolio model for storing portfolio data."""
    __tablename__ = "portfolios"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    total_value = Column(Float, default=0)
    cash_balance = Column(Float, default=0)
    invested = Column(Float, default=0)
    unrealized_pnl = Column(Float, default=0)
    realized_pnl = Column(Float, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="portfolios")

class Strategy(Base):
    """Strategy model for storing strategy configuration."""
    __tablename__ = "strategies"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    name = Column(String)
    strategy_type = Column(String)  # trend, reversion, scalp, manual
    symbol = Column(String)
    risk_level = Column(String)  # low, medium, high, custom
    stop_loss = Column(Float)
    target_profit = Column(Float)
    capital = Column(Float)
    status = Column(String, default="inactive")  # active, inactive, paused
    config = Column(JSON)  # Additional config
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="strategies")

class Trade(Base):
    """Trade model for storing executed trades."""
    __tablename__ = "trades"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    strategy_id = Column(String, ForeignKey("strategies.id"), nullable=True)
    symbol = Column(String)
    side = Column(String)  # BUY, SELL
    quantity = Column(Integer)
    entry_price = Column(Float)
    exit_price = Column(Float, nullable=True)
    status = Column(String)  # OPEN, CLOSED
    pnl = Column(Float, nullable=True)
    entry_time = Column(DateTime, default=datetime.utcnow)
    exit_time = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="trades")
