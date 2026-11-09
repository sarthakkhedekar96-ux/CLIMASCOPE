import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "CLIMASCOPE"
    PROJECT_TITLE: str = "CLIMASCOPE – Climate Intelligence & Resilience Platform"
    PROJECT_DESCRIPTION: str = (
        "Enterprise-grade city-level climate intelligence platform for municipal "
        "environmental deterioration detection, causal investigation, risk prediction, "
        "intervention simulation, budget optimization, and empirical action verification."
    )
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("true", "1", "yes")

    # Database
    # Support PostgreSQL production connections and deterministic SQLite development paths
    _raw_db_url = os.getenv("DATABASE_URL")
    if _raw_db_url:
        # Normalize Render/Heroku postgres:// or postgresql:// to explicit psycopg2 driver
        if _raw_db_url.startswith("postgres://"):
            _raw_db_url = _raw_db_url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif _raw_db_url.startswith("postgresql://"):
            _raw_db_url = _raw_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        DATABASE_URL: str = _raw_db_url
    else:
        # Deterministically resolve absolute path for default SQLite database
        _backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        _backend_db = os.path.join(_backend_dir, "climascope.db")
        _root_db = os.path.abspath(os.path.join(_backend_dir, "..", "climascope.db"))

        if os.path.exists(_backend_db) and os.path.getsize(_backend_db) > 0:
            _chosen_db = _backend_db
        elif os.path.exists(_root_db) and os.path.getsize(_root_db) > 0:
            _chosen_db = _root_db
        else:
            _chosen_db = _backend_db

        DATABASE_URL: str = f"sqlite:///{_chosen_db.replace(os.sep, '/')}"

    # CORS Origin Allowlist
    _cors_env = os.getenv("CORS_ORIGINS", "")
    if _cors_env:
        CORS_ORIGINS: List[str] = [o.strip() for o in _cors_env.split(",") if o.strip()]
    else:
        CORS_ORIGINS: List[str] = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
            "https://climascope.vercel.app",
        ]

    _frontend_url = os.getenv("FRONTEND_URL", "").strip()
    if _frontend_url and _frontend_url not in CORS_ORIGINS:
        CORS_ORIGINS.append(_frontend_url)

    # LLM Settings
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-2.0-flash")

settings = Settings()
