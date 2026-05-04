from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.db.database import Base, engine
from app.api.routes import sessions
import app.db.models  # ensures models are registered

# Create all tables (safety net alongside Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Performing Arts Coach",
    description="Multimodal feedback for actors, speakers, and singers",
    version="1.0.0",
)

# Allow React dev server to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads as static so frontend can display videos
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register routes
app.include_router(sessions.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}