import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "ApexRetail Global Pricing Platform"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database config: default to local SQLite with WAL mode, or override with PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./pricing_platform.db")
    
    # Bulk batch chunk size for CSV streaming
    CSV_CHUNK_SIZE: int = int(os.getenv("CSV_CHUNK_SIZE", "2000"))
    
    # CORS Origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()
