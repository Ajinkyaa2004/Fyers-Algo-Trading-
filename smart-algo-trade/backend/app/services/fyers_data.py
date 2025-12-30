from app.services.fyers_auth import fyers_auth_service
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

class FyersDataService:
    def get_profile(self) -> Dict:
        try:
            fyers = fyers_auth_service.get_fyers_instance()
            response = fyers.get_profile()
            if response.get("s") == "ok":
                return response.get("data", {})
            logger.error(f"Profile API Error: {response}")
            return {}
        except Exception as e:
            logger.error(f"Error fetching profile: {str(e)}")
            return {}

    def get_funds(self) -> Dict:
        try:
            fyers = fyers_auth_service.get_fyers_instance()
            response = fyers.funds()
            if response.get("s") == "ok":
                return response.get("fund_limit", {})
            logger.error(f"Funds API Error: {response}")
            return {"availableMargin": 0, "usedMargin": 0}
        except Exception as e:
            logger.error(f"Error fetching funds: {str(e)}")
            return {"availableMargin": 0, "usedMargin": 0}

    def get_holdings(self) -> List:
        try:
            fyers = fyers_auth_service.get_fyers_instance()
            response = fyers.holdings()
            if response.get("s") == "ok":
                holdings = response.get("holdings", [])
                logger.info(f"Retrieved {len(holdings)} holdings")
                
                # Enrich holdings with calculated P&L and normalized field names
                enriched_holdings = []
                for holding in holdings:
                    if isinstance(holding, dict):
                        # Normalize field names from Fyers API
                        # Fyers uses various field names, we need to map them
                        
                        # Get quantity (try multiple field names)
                        quantity = holding.get('quantity') or holding.get('qty') or holding.get('Qty') or 0
                        quantity = float(quantity) if quantity else 0
                        
                        # Get last price / LTP (try multiple field names)
                        last_price = (holding.get('ltp') or holding.get('lastPrice') or 
                                    holding.get('last_price') or holding.get('LTP') or 0)
                        last_price = float(last_price) if last_price else 0
                        
                        # Get average price (try multiple field names)
                        avg_price = (holding.get('avgPrice') or holding.get('avg_price') or 
                                   holding.get('buyPrice') or holding.get('buy_price') or 0)
                        avg_price = float(avg_price) if avg_price else 0
                        
                        # Normalize standard fields
                        holding['quantity'] = quantity
                        holding['last_price'] = last_price
                        holding['average_price'] = avg_price
                        
                        # Calculate P&L - ALWAYS calculate fresh to ensure accuracy
                        if quantity > 0 and last_price > 0 and avg_price > 0:
                            pnl = (last_price - avg_price) * quantity
                            pnl_percent = ((last_price - avg_price) / avg_price) * 100
                        else:
                            pnl = 0
                            pnl_percent = 0
                        
                        holding['pnl'] = round(pnl, 2)
                        holding['pnl_percent'] = round(pnl_percent, 2)
                        
                        # Map day change fields
                        holding['day_change'] = holding.get('p_l') or holding.get('dayChange') or 0
                        holding['day_change_percentage'] = holding.get('p_l_perc') or holding.get('dayChangePercent') or 0
                        
                        logger.info(f"Holding {holding.get('tradingsymbol', 'UNKNOWN')}: qty={quantity}, avg={avg_price}, ltp={last_price}, pnl={pnl}")
                        enriched_holdings.append(holding)
                
                return enriched_holdings if isinstance(enriched_holdings, list) else []
            logger.error(f"Holdings API Error: {response}")
            return []
        except Exception as e:
            logger.error(f"Error fetching holdings: {str(e)}", exc_info=True)
            return []

    def get_positions(self) -> List:
        try:
            fyers = fyers_auth_service.get_fyers_instance()
            response = fyers.positions()
            if response.get("s") == "ok":
                positions = response.get("netPositions", [])
                logger.info(f"Retrieved {len(positions)} positions")
                return positions if isinstance(positions, list) else []
            logger.error(f"Positions API Error: {response}")
            return []
        except Exception as e:
            logger.error(f"Error fetching positions: {str(e)}")
            return []

    def get_orders(self) -> List:
        try:
            fyers = fyers_auth_service.get_fyers_instance()
            response = fyers.orderbook()
            if response.get("s") == "ok":
                orders = response.get("orderBook", [])
                logger.info(f"Retrieved {len(orders)} orders")
                return orders if isinstance(orders, list) else []
            logger.error(f"Orders API Error: {response}")
            return []
        except Exception as e:
            logger.error(f"Error fetching orders: {str(e)}")
            return []

    def get_margins(self) -> Dict:
        try:
            fyers = fyers_auth_service.get_fyers_instance()
            response = fyers.funds()
            if response.get("s") == "ok":
                return response.get("fund_limit", {})
            logger.error(f"Margins API Error: {response}")
            return {}
        except Exception as e:
            logger.error(f"Error fetching margins: {str(e)}")
            return {}

    def get_quotes(self, symbols: str) -> Dict:
        try:
            fyers = fyers_auth_service.get_fyers_instance()
            data = {"symbols": symbols}
            response = fyers.quotes(data)
            if response.get("s") == "ok":
                quotes = response.get("d", {})
                logger.info(f"Retrieved quotes for {len(quotes)} symbols")
                return quotes
            logger.error(f"Quotes API Error: {response}")
            return {}
        except Exception as e:
            logger.error(f"Error fetching quotes: {str(e)}")
            return {}

    def get_quotes_detailed(self, symbols: str) -> Dict:
        """
        Get detailed quote information for symbols
        
        Returns structured quote data with:
        - stockname: Stock/symbol name
        - exchange: Exchange name
        - high_price: Today's high price
        - low_price: Today's low price
        - open_price: Today's open price
        - prev_close_price: Previous close price
        - volume: Today's volume
        - ltp: Last traded price
        - bid: Bid price
        - ask: Ask price
        """
        try:
            fyers = fyers_auth_service.get_fyers_instance()
            data = {"symbols": symbols}
            response = fyers.quotes(data)
            
            if response.get("s") != "ok":
                logger.error(f"Quotes API Error: {response}")
                return {}
            
            quotes_list = response.get("d", [])
            detailed_quotes = []
            
            for quote in quotes_list:
                try:
                    # Extract symbol name
                    symbol_name = quote.get("n", "")
                    
                    # Extract value data
                    value_data = quote.get("v", {})
                    
                    # Structure the detailed quote information
                    detailed_quote = {
                        "symbol": symbol_name,
                        "exchange": value_data.get("exchange", ""),
                        "high_price": value_data.get("high_price", 0),
                        "low_price": value_data.get("low_price", 0),
                        "open_price": value_data.get("open_price", 0),
                        "prev_close_price": value_data.get("prev_close_price", 0),
                        "volume": value_data.get("volume", 0),
                        "ltp": value_data.get("lp", 0),  # Last traded price
                        "bid": value_data.get("bid", 0),  # Bid price
                        "ask": value_data.get("ask", 0),  # Ask price
                        "bid_size": value_data.get("bidsize", 0),  # Bid quantity
                        "ask_size": value_data.get("asksize", 0),  # Ask quantity
                        "ltp_time": value_data.get("ltp_time", ""),  # Last trade time
                    }
                    detailed_quotes.append(detailed_quote)
                
                except Exception as e:
                    logger.error(f"Error processing quote for symbol: {e}")
                    continue
            
            logger.info(f"Retrieved detailed quotes for {len(detailed_quotes)} symbols")
            return {
                "count": len(detailed_quotes),
                "quotes": detailed_quotes
            }
        
        except Exception as e:
            logger.error(f"Error fetching detailed quotes: {str(e)}")
            return {"count": 0, "quotes": []}


    def get_depth(self, symbol: str) -> Dict:
        """Get market depth for a symbol"""
        try:
            fyers = fyers_auth_service.get_fyers_instance()
            data = {
                "symbol": symbol,
                "ohlcv_flag": "1"
            }
            response = fyers.depth(data=data)
            if response.get("s") == "ok":
                depth_data = response.get("d", {})
                logger.info(f"Retrieved depth data for {symbol}")
                return depth_data
            logger.error(f"Depth API Error: {response}")
            return {}
        except Exception as e:
            logger.error(f"Error fetching depth for {symbol}: {str(e)}")
            return {}

    def get_market_depth(self, symbol: str) -> Dict:
        """
        Get detailed market depth information for a symbol
        
        Returns structured market depth data with:
        - totalbuyqty: Total buy quantity
        - totalsellqty: Total sell quantity
        - bids: Top 5 bid levels
        - asks: Top 5 ask levels
        - upper_ckt: Upper circuit limit
        - lower_ckt: Lower circuit limit
        - ohlcv: OHLCV data if available
        """
        try:
            fyers = fyers_auth_service.get_fyers_instance()
            data = {
                "symbol": symbol,
                "ohlcv_flag": "1"
            }
            response = fyers.depth(data=data)
            
            if response.get("s") != "ok":
                logger.error(f"Market Depth API Error: {response}")
                return {}
            
            # Extract depth data for the symbol
            depth_data = response.get("d", {})
            symbol_depth = depth_data.get(symbol, {})
            
            # Extract and structure the market depth information
            market_depth = {
                "symbol": symbol,
                "totalbuyqty": symbol_depth.get("totalbuyqty", 0),
                "totalsellqty": symbol_depth.get("totalsellqty", 0),
                "bids": symbol_depth.get("bids", []),  # Top 5 bid levels
                "asks": symbol_depth.get("ask", []),   # Top 5 ask levels
                "upper_ckt": symbol_depth.get("upper_ckt", None),  # Upper circuit limit
                "lower_ckt": symbol_depth.get("lower_ckt", None),  # Lower circuit limit
                "ltp": symbol_depth.get("ltp", None),  # Last traded price
                "ohlcv": symbol_depth.get("ohlcv", None)  # OHLCV data
            }
            
            logger.info(f"Retrieved market depth for {symbol}: Buy={market_depth['totalbuyqty']}, Sell={market_depth['totalsellqty']}")
            return market_depth
        
        except Exception as e:
            logger.error(f"Error fetching market depth for {symbol}: {str(e)}")
            return {}


    def get_history(self, symbol: str, resolution: str = "D", range_from: int = None, range_to: int = None) -> Dict:
        """Get historical data for a symbol
        resolution: D=daily, 1=1min, 5=5min, 15=15min, 60=1hour, W=weekly, M=monthly
        """
        try:
            fyers = fyers_auth_service.get_fyers_instance()
            data = {
                "symbol": symbol,
                "resolution": resolution,
                "date_format": "0",
                "cont_flag": "1"
            }
            if range_from:
                data["range_from"] = range_from
            if range_to:
                data["range_to"] = range_to
            
            response = fyers.history(data=data)
            if response.get("s") == "ok":
                candles = response.get("candles", [])
                logger.info(f"Retrieved {len(candles)} candles for {symbol} ({resolution})")
                return candles
            logger.error(f"History API Error: {response}")
            return []
        except Exception as e:
            logger.error(f"Error fetching history for {symbol}: {str(e)}")
            return []

    def search_symbol(self, query: str) -> List:
        """Search for symbols"""
        fyers = fyers_auth_service.get_fyers_instance()
        data = {"query": query}
        response = fyers.symbol_search(data=data)
        if response.get("s") == "ok":
            return response.get("data", [])
        raise Exception(f"Failed to search symbols: {response.get('message')}")

    def place_order(self, order_data: Dict) -> Dict:
        """Place a single order
        order_data should contain: symbol, qty, type, side, productType, limitPrice, stopPrice, validity, disclosedQty, offlineOrder
        """
        fyers = fyers_auth_service.get_fyers_instance()
        response = fyers.place_order(data=order_data)
        if response.get("s") == "ok":
            return response.get("data", {})
        raise Exception(f"Failed to place order: {response.get('message')}")

    def place_basket_orders(self, orders: List[Dict]) -> Dict:
        """Place multiple orders in a basket
        orders should be a list of order dicts
        """
        fyers = fyers_auth_service.get_fyers_instance()
        response = fyers.place_basket_orders(data=orders)
        if response.get("s") == "ok":
            return response.get("data", {})
        raise Exception(f"Failed to place basket orders: {response.get('message')}")

    def modify_order(self, order_data: Dict) -> Dict:
        """Modify an existing order
        order_data should contain: id, type, limitPrice, qty
        """
        fyers = fyers_auth_service.get_fyers_instance()
        response = fyers.modify_order(data=order_data)
        if response.get("s") == "ok":
            return response.get("data", {})
        raise Exception(f"Failed to modify order: {response.get('message')}")

    def modify_basket_orders(self, orders: List[Dict]) -> Dict:
        """Modify multiple orders
        orders should be a list of order dicts with: id, type, limitPrice, qty
        """
        fyers = fyers_auth_service.get_fyers_instance()
        response = fyers.modify_basket_orders(data=orders)
        if response.get("s") == "ok":
            return response.get("data", {})
        raise Exception(f"Failed to modify basket orders: {response.get('message')}")

    def cancel_order(self, order_id: str) -> Dict:
        """Cancel an order by ID"""
        fyers = fyers_auth_service.get_fyers_instance()
        data = {"id": order_id}
        response = fyers.cancel_order(data=data)
        if response.get("s") == "ok":
            return response.get("data", {})
        raise Exception(f"Failed to cancel order: {response.get('message')}")

    def convert_position(self, symbol: str, position_side: int, convert_qty: int, convert_from: str, convert_to: str) -> Dict:
        """Convert position from INTRADAY to CNC or vice versa
        position_side: 1=Long, -1=Short
        convert_from: INTRADAY, CNC, etc.
        convert_to: CNC, INTRADAY, etc.
        """
        fyers = fyers_auth_service.get_fyers_instance()
        data = {
            "symbol": symbol,
            "positionSide": position_side,
            "convertQty": convert_qty,
            "convertFrom": convert_from,
            "convertTo": convert_to
        }
        response = fyers.convert_position(data=data)
        if response.get("s") == "ok":
            return response.get("data", {})
        raise Exception(f"Failed to convert position: {response.get('message')}")

    def exit_positions(self, position_id: str = None) -> Dict:
        """Exit all positions or a specific position by ID
        If position_id is None, exits all positions
        """
        fyers = fyers_auth_service.get_fyers_instance()
        data = {}
        if position_id:
            data["id"] = position_id
        
        response = fyers.exit_positions(data=data)
        if response.get("s") == "ok":
            return response.get("data", {})
        raise Exception(f"Failed to exit positions: {response.get('message')}")

    def get_market_status(self) -> List:
        """Fetch market status for all exchanges"""
        try:
            fyers = fyers_auth_service.get_fyers_instance()
            response = fyers.market_status()
            if response.get("s") == "ok":
                return response.get("data", [])
            logger.error(f"Market status API Error: {response}")
            return []
        except Exception as e:
            logger.error(f"Error fetching market status: {str(e)}")
            return []

fyers_data_service = FyersDataService()
