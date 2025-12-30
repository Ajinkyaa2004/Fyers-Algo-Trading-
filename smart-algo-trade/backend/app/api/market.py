from fastapi import APIRouter, HTTPException, Query
from app.services.fyers_data import fyers_data_service

router = APIRouter()

@router.get("/quote")
async def get_quotes(symbols: str = Query(...)):
    try:
        data = fyers_data_service.get_quotes(symbols)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/market-status")
async def get_market_status():
    """Get current market status for all exchanges"""
    try:
        data = fyers_data_service.get_market_status()
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
