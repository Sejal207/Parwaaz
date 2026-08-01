import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

DATABASE_URL = os.getenv("DATABASE_URL") or getattr(settings, "DATABASE_URL", "sqlite:///./app.db")

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    connect_args = {
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=60,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency — yields a DB session, closes it after request."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_db_session_with_retry(max_retries=3):
    """Helper to get a database session that retries if Neon SSL connection was dropped."""
    import time
    from sqlalchemy.exc import OperationalError
    for attempt in range(max_retries):
        try:
            db = SessionLocal()
            # Test connection with ping
            db.execute(text("SELECT 1"))
            return db
        except OperationalError as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(0.5)