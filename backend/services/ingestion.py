import os
import uuid
import shutil
from fastapi import UploadFile, BackgroundTasks
from sqlalchemy.orm import Session
from models.database import UploadedPcap, SessionLocal
from analyzers import tcp_reassembler, file_extractor
from parsers import pcap_parser, zeek_parser
from detectors import attack_detector, c2_detector
from timeline import timeline_builder
from utils import ioc_engine
import logging

logger = logging.getLogger(__name__)

async def save_and_enqueue(file: UploadFile, background_tasks: BackgroundTasks, db: Session) -> str:
    file_id = str(uuid.uuid4())
    upload_dir = "data/uploads"
    file_path = os.path.join(upload_dir, f"{file_id}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        while True:
            chunk = await file.read(1024 * 1024) # Read in 1MB chunks
            if not chunk:
                break
            buffer.write(chunk)
    
    size_bytes = os.path.getsize(file_path)
    
    pcap_record = UploadedPcap(
        id=file_id,
        filename=file.filename,
        file_path=file_path,
        size_bytes=size_bytes,
        status="processing",
        progress=0.0
    )
    db.add(pcap_record)
    db.commit()
    
    background_tasks.add_task(process_pcap, file_id, file_path)
    return file_id

def process_pcap(file_id: str, file_path: str):
    db = SessionLocal()
    pcap_record = db.query(UploadedPcap).filter(UploadedPcap.id == file_id).first()
    if not pcap_record:
        db.close()
        return

    try:
        update_progress(db, pcap_record, 10.0)
        
        # 1. PCAP Parsing (Basic stats)
        logger.info(f"Parsing PCAP {file_id}")
        pcap_parser.parse(file_path, file_id, db)
        update_progress(db, pcap_record, 20.0)
        
        # 2. Zeek Processing
        logger.info(f"Running Zeek on {file_id}")
        zeek_parser.run_zeek(file_path, file_id, db)
        update_progress(db, pcap_record, 40.0)
        
        # 3. TCP Stream Reassembly
        logger.info(f"Reassembling TCP streams for {file_id}")
        tcp_reassembler.process(file_path, file_id, db)
        update_progress(db, pcap_record, 60.0)
        
        # 4. File Extraction
        logger.info(f"Extracting files for {file_id}")
        file_extractor.extract(file_path, file_id, db)
        update_progress(db, pcap_record, 70.0)
        
        # 5. Attack & C2 Detection
        logger.info(f"Detecting attacks for {file_id}")
        attack_detector.detect(file_id, db)
        c2_detector.detect(file_id, db)
        update_progress(db, pcap_record, 85.0)
        
        # 6. IOC Extraction
        logger.info(f"Extracting IOCs for {file_id}")
        ioc_engine.extract(file_id, db)
        
        # 7. Timeline Building
        logger.info(f"Building timeline for {file_id}")
        timeline_builder.build(file_id, db)
        update_progress(db, pcap_record, 100.0)
        
        pcap_record.status = "completed"
        db.commit()

    except Exception as e:
        logger.error(f"Error processing PCAP {file_id}: {str(e)}")
        pcap_record.status = "failed"
        db.commit()
    finally:
        db.close()

def update_progress(db: Session, record: UploadedPcap, progress: float):
    record.progress = progress
    db.commit()
