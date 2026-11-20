from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import health, ocr, rag, copilot, scheduler

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade AI medical document processing, clinical entity extraction, vector retrieval (RAG), and reasoning engine for ChronicAI.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api/v1
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(ocr.router, prefix=settings.API_V1_STR)
app.include_router(rag.router, prefix=settings.API_V1_STR)
app.include_router(copilot.router, prefix=settings.API_V1_STR)
app.include_router(scheduler.router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_check": f"{settings.API_V1_STR}/health",
        "status": "operational",
    }
