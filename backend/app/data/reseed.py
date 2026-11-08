import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.core.database import SessionLocal, Base, engine
from app.data.seed_data import seed_database

def reseed():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db, force_reseed=True)
    finally:
        db.close()

if __name__ == "__main__":
    reseed()
