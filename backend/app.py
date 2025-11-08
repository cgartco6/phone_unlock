#!/usr/bin/env python3
"""
AI Phone Unlock Tool - Main Backend Application
Combines synthetic intelligence, strategic intelligence, deep agents, and AI helpers
"""

import asyncio
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from config.settings import settings
from agents.synthetic_intelligence import SyntheticIntelligence
from agents.strategic_intelligence import StrategicIntelligence
from agents.deep_agents import DeepAgents
from agents.ai_helpers import AIHelpers
from services.device_detection import DeviceDetectionService
from services.unlock_engine import UnlockEngine
from services.self_healing import SelfHealingSystem
from services.tool_integration import ToolIntegrationService
from utils.logger import setup_logging

# Setup logging
logger = setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info("Initializing AI Phone Unlock System...")
    
    # Initialize AI components
    app.state.synthetic_intelligence = SyntheticIntelligence()
    app.state.strategic_intelligence = StrategicIntelligence()
    app.state.deep_agents = DeepAgents()
    app.state.ai_helpers = AIHelpers()
    
    # Initialize services
    app.state.device_detection = DeviceDetectionService()
    app.state.unlock_engine = UnlockEngine()
    app.state.self_healing = SelfHealingSystem()
    app.state.tool_integration = ToolIntegrationService()
    
    # Load AI models and tools
    await app.state.synthetic_intelligence.initialize()
    await app.state.strategic_intelligence.initialize()
    await app.state.deep_agents.initialize()
    
    logger.info("AI Phone Unlock System initialized successfully")
    yield
    
    # Shutdown
    logger.info("Shutting down AI Phone Unlock System...")

app = FastAPI(
    title="AI Phone Unlock Tool",
    description="Advanced phone unlocking system with AI agents",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "AI Phone Unlock Tool API",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    """System health check"""
    return {
        "status": "healthy",
        "components": {
            "synthetic_intelligence": app.state.synthetic_intelligence.get_status(),
            "strategic_intelligence": app.state.strategic_intelligence.get_status(),
            "deep_agents": app.state.deep_agents.get_status(),
            "ai_helpers": app.state.ai_helpers.get_status(),
            "self_healing": app.state.self_healing.get_status()
        }
    }

@app.post("/api/detect-device")
async def detect_device():
    """Detect connected device"""
    try:
        device_info = await app.state.device_detection.detect_connected_device()
        analysis = await app.state.synthetic_intelligence.analyze_device(device_info)
        
        return {
            "success": True,
            "device": device_info,
            "analysis": analysis,
            "recommended_actions": app.state.strategic_intelligence.get_actions(analysis)
        }
    except Exception as e:
        logger.error(f"Device detection failed: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "self_healing": await app.state.self_healing.handle_error(e, "device_detection")
        }

@app.post("/api/start-unlock")
async def start_unlock(device_id: str, method: str = "auto"):
    """Start unlock process for device"""
    try:
        # Get strategic plan
        plan = await app.state.strategic_intelligence.create_unlock_plan(device_id, method)
        
        # Execute with deep agents
        result = await app.state.deep_agents.execute_unlock_plan(plan)
        
        return {
            "success": True,
            "plan": plan,
            "result": result,
            "logs": app.state.ai_helpers.get_process_logs()
        }
    except Exception as e:
        logger.error(f"Unlock process failed: {str(e)}")
        healing_result = await app.state.self_healing.handle_error(e, "unlock_process")
        return {
            "success": False,
            "error": str(e),
            "self_healing": healing_result,
            "alternative_methods": await app.state.strategic_intelligence.get_alternatives(device_id)
        }

@app.websocket("/ws/unlock-progress")
async def websocket_unlock_progress(websocket: WebSocket):
    """WebSocket for real-time unlock progress"""
    await websocket.accept()
    try:
        while True:
            progress = await app.state.ai_helpers.get_live_progress()
            await websocket.send_json(progress)
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
