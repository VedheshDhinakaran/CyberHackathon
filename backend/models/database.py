from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import os

# Database URI for the local SQLite data store.
DATABASE_URL = "sqlite:///./data/db/netrecon.db"

# Ensure the database directory exists before engine creation.
os.makedirs(os.path.dirname(DATABASE_URL.replace("sqlite:///", "")), exist_ok=True)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class UploadedPcap(Base):
    """Stores metadata for each uploaded capture file."""
    __tablename__ = "uploaded_pcaps"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_path = Column(String)
    size_bytes = Column(Integer)
    upload_time = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="uploaded")  # uploaded, processing, completed, failed
    progress = Column(Float, default=0.0)

class TCPSession(Base):
    """Stores session-level metadata derived from capture parsing."""
    __tablename__ = "tcp_sessions"

    id = Column(Integer, primary_key=True, index=True)
    pcap_id = Column(String, ForeignKey("uploaded_pcaps.id"))
    src_ip = Column(String, index=True)
    dst_ip = Column(String, index=True)
    src_port = Column(Integer)
    dst_port = Column(Integer)
    protocol = Column(String)
    packet_count = Column(Integer)
    byte_count = Column(Integer)
    session_duration = Column(Float)
    start_time = Column(DateTime)

class ExtractedFile(Base):
    """Stores metadata for recovered files extracted from captures."""
    __tablename__ = "extracted_files"

    id = Column(Integer, primary_key=True, index=True)
    pcap_id = Column(String, ForeignKey("uploaded_pcaps.id"))
    filename = Column(String)
    file_path = Column(String)
    protocol = Column(String)  # HTTP, SMB, etc.
    md5_hash = Column(String)
    sha256_hash = Column(String)
    mime_type = Column(String)
    entropy = Column(Float)
    extraction_time = Column(DateTime, default=datetime.utcnow)

class TimelineEvent(Base):
    """Stores discrete analysis events used to build the attack timeline."""
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    pcap_id = Column(String, ForeignKey("uploaded_pcaps.id"))
    timestamp = Column(DateTime)
    src_ip = Column(String)
    dst_ip = Column(String)
    protocol = Column(String)
    event_type = Column(String)  # port_scan, exploit, c2_beacon, exfiltration, file_transfer
    severity = Column(String)  # low, medium, high, critical
    description = Column(String)
    evidence = Column(String)

class Indicator(Base):
    """Stores extracted IOCs such as IPs, domains, hashes, and other observables."""
    __tablename__ = "indicators"

    id = Column(Integer, primary_key=True, index=True)
    pcap_id = Column(String, ForeignKey("uploaded_pcaps.id"))
    ioc_type = Column(String, index=True)  # ip, domain, url, hash, user_agent, filename
    value = Column(String, index=True)
    source = Column(String)
    description = Column(String)

class SuspiciousHost(Base):
    """Stores hosts that appear suspicious during analysis."""
    __tablename__ = "suspicious_hosts"

    id = Column(Integer, primary_key=True, index=True)
    pcap_id = Column(String, ForeignKey("uploaded_pcaps.id"))
    ip_address = Column(String, index=True)
    role = Column(String)  # attacker, c2, victim
    score = Column(Float)

def init_db():
    """Create all database tables if they do not already exist."""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Provide a database session for request handlers."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
