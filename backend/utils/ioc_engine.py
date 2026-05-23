from sqlalchemy.orm import Session
from models.database import ExtractedFile, Indicator, SuspiciousHost

def extract(file_id: str, db: Session):
    # Add hashes of extracted files as IOCs
    files = db.query(ExtractedFile).filter(ExtractedFile.pcap_id == file_id).all()
    for f in files:
        if f.md5_hash:
            db.add(Indicator(pcap_id=file_id, ioc_type="hash", value=f.md5_hash, source="file_extraction", description=f"Extracted file: {f.filename}"))
        if f.sha256_hash:
            db.add(Indicator(pcap_id=file_id, ioc_type="hash", value=f.sha256_hash, source="file_extraction", description=f"Extracted file: {f.filename}"))
            
    db.commit()
