from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from app.models import Strategy, Trade, User
from typing import List, Dict, Any
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/create")
async def create_strategy(
    user_id: str,
    strategy_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Create a new trading strategy."""
    try:
        # Validate user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not authenticated")
        
        strategy = Strategy(
            id=str(uuid.uuid4()),
            user_id=user_id,
            name=strategy_data.get("name"),
            strategy_type=strategy_data.get("strategy_type"),
            symbol=strategy_data.get("symbol"),
            risk_level=strategy_data.get("risk_level"),
            stop_loss=float(strategy_data.get("stop_loss", 1.0)),
            target_profit=float(strategy_data.get("target_profit", 2.0)),
            capital=float(strategy_data.get("capital", 50000)),
            config=strategy_data.get("config", {})
        )
        
        db.add(strategy)
        db.commit()
        db.refresh(strategy)
        
        logger.info(f"Strategy created: {strategy.id} for user {user_id}")
        
        return {
            "status": "success",
            "strategy_id": strategy.id,
            "message": "Strategy created successfully"
        }
    except Exception as e:
        logger.error(f"Error creating strategy: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list/{user_id}")
async def list_strategies(user_id: str, db: Session = Depends(get_db)):
    """List all strategies for a user."""
    try:
        strategies = db.query(Strategy).filter(Strategy.user_id == user_id).all()
        return {
            "status": "success",
            "strategies": [
                {
                    "id": s.id,
                    "name": s.name,
                    "type": s.strategy_type,
                    "symbol": s.symbol,
                    "risk_level": s.risk_level,
                    "status": s.status,
                    "capital": s.capital,
                    "stop_loss": s.stop_loss,
                    "target_profit": s.target_profit
                }
                for s in strategies
            ]
        }
    except Exception as e:
        logger.error(f"Error listing strategies: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/activate/{strategy_id}")
async def activate_strategy(strategy_id: str, db: Session = Depends(get_db)):
    """Activate a strategy."""
    try:
        strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")
        
        strategy.status = "active"
        strategy.updated_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"Strategy activated: {strategy_id}")
        
        return {"status": "success", "message": "Strategy activated"}
    except Exception as e:
        logger.error(f"Error activating strategy: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/deactivate/{strategy_id}")
async def deactivate_strategy(strategy_id: str, db: Session = Depends(get_db)):
    """Deactivate a strategy."""
    try:
        strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")
        
        strategy.status = "inactive"
        strategy.updated_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"Strategy deactivated: {strategy_id}")
        
        return {"status": "success", "message": "Strategy deactivated"}
    except Exception as e:
        logger.error(f"Error deactivating strategy: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/performance/{strategy_id}")
async def get_strategy_performance(strategy_id: str, db: Session = Depends(get_db)):
    """Get performance metrics for a strategy."""
    try:
        trades = db.query(Trade).filter(
            Trade.strategy_id == strategy_id,
            Trade.status == "CLOSED"
        ).all()
        
        if not trades:
            return {
                "status": "success",
                "total_trades": 0,
                "winning_trades": 0,
                "losing_trades": 0,
                "win_rate": 0,
                "total_pnl": 0,
                "avg_profit": 0
            }
        
        winning = sum(1 for t in trades if t.pnl and t.pnl > 0)
        losing = sum(1 for t in trades if t.pnl and t.pnl <= 0)
        total_pnl = sum(t.pnl for t in trades if t.pnl)
        
        return {
            "status": "success",
            "total_trades": len(trades),
            "winning_trades": winning,
            "losing_trades": losing,
            "win_rate": (winning / len(trades) * 100) if trades else 0,
            "total_pnl": total_pnl,
            "avg_profit": total_pnl / len(trades) if trades else 0
        }
    except Exception as e:
        logger.error(f"Error getting strategy performance: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
