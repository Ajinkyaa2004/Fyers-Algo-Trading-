import logging
from functools import wraps
from typing import Callable, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def log_route(func: Callable) -> Callable:
    """Decorator to log route access and errors."""
    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        try:
            logger.info(f"Route accessed: {func.__name__}")
            result = await func(*args, **kwargs)
            logger.info(f"Route completed: {func.__name__}")
            return result
        except Exception as e:
            logger.error(f"Route error in {func.__name__}: {str(e)}", exc_info=True)
            raise
    return wrapper

def get_logger(name: str) -> logging.Logger:
    """Get logger for a module."""
    return logging.getLogger(name)
