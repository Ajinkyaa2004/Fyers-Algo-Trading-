from typing import Optional, Pattern
import re

class Validator:
    """Input validation utilities."""
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format."""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_symbol(symbol: str) -> bool:
        """Validate trading symbol."""
        pattern = r'^[A-Z0-9\-]{1,20}$'
        return re.match(pattern, symbol) is not None
    
    @staticmethod
    def validate_positive_number(value: float) -> bool:
        """Validate positive number."""
        try:
            return float(value) > 0
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def validate_stop_loss(stop_loss: float, current_price: float) -> bool:
        """Validate stop loss is below current price."""
        return stop_loss < current_price
    
    @staticmethod
    def validate_quantity(quantity: int) -> bool:
        """Validate quantity is positive integer."""
        try:
            return int(quantity) > 0
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 255) -> str:
        """Sanitize string input."""
        if not isinstance(value, str):
            raise ValueError("Expected string")
        
        # Remove dangerous characters
        value = value.strip()
        if len(value) > max_length:
            value = value[:max_length]
        
        return value
    
    @staticmethod
    def validate_strategy_config(config: dict) -> bool:
        """Validate strategy configuration."""
        required_fields = ['strategy_type', 'symbol', 'risk_level', 'capital']
        
        for field in required_fields:
            if field not in config or config[field] is None:
                return False
        
        if not Validator.validate_symbol(config['symbol']):
            return False
        
        if not Validator.validate_positive_number(config['capital']):
            return False
        
        if config['risk_level'] not in ['low', 'medium', 'high', 'custom']:
            return False
        
        return True
