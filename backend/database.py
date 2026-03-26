import os
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import StaticPool

DB_PATH = os.getenv("DB_PATH", "./vendrixa.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(engine, "connect")
def _set_sqlite_pragmas(conn, _rec):
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL")       # lecturas paralelas sin bloquear escrituras
    cur.execute("PRAGMA synchronous=NORMAL")     # ~3x más rápido, seguro con WAL
    cur.execute("PRAGMA cache_size=-65536")      # 64 MB caché en RAM
    cur.execute("PRAGMA temp_store=MEMORY")      # tablas temporales en RAM
    cur.execute("PRAGMA mmap_size=268435456")    # 256 MB mmap para lecturas
    cur.execute("PRAGMA foreign_keys=ON")
    cur.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
