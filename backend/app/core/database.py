import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger("climascope.database")

# Database engine configuration with sensible connection pooling
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True,
        echo=False
    )
else:
    # Production PostgreSQL connection with resilient pooling via psycopg2
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        pool_recycle=1800,
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db(force_reseed: bool = False) -> None:
    """
    Idempotent database initializer.
    Safely creates tables if not present, and triggers baseline seeding if empty.
    Never drops tables during normal application or production startup.
    """
    try:
        # Import models so Base registers all schema metadata before create_all
        import app.models.ward
        import app.models.climate_metric
        import app.models.intervention
        import app.models.evidence
        import app.models.ledger

        Base.metadata.create_all(bind=engine)
        logger.info("Database schema verified/created successfully.")

        from app.data.seed_data import seed_database
        db = SessionLocal()
        try:
            seed_database(db, force_reseed=force_reseed)
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Critical error during database initialization: {e}")
        raise

def get_db() -> Generator[Session, None, None]:
    """Dependency that yields a database session and closes it cleanly."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
