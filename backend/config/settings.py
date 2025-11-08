import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Application
    APP_NAME = "AI Phone Unlock Tool"
    VERSION = "1.0.0"
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    
    # Server
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8000))
    
    # AI Models
    AI_MODEL_PATH = os.getenv("AI_MODEL_PATH", "./models")
    DEVICE_DATABASE_PATH = os.getenv("DEVICE_DATABASE_PATH", "./database/devices.json")
    
    # Security
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
    
    # Unlock Tools
    TOOL_INTEGRATION_TIMEOUT = int(os.getenv("TOOL_INTEGRATION_TIMEOUT", 300))
    MAX_RETRY_ATTEMPTS = int(os.getenv("MAX_RETRY_ATTEMPTS", 3))
    
    # Self-Healing
    SELF_HEALING_ENABLED = os.getenv("SELF_HEALING_ENABLED", "True").lower() == "true"
    HEALTH_CHECK_INTERVAL = int(os.getenv("HEALTH_CHECK_INTERVAL", 60))

settings = Settings()
