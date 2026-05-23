from sqlalchemy.orm import Session
from models.database import ExtractedFile, TimelineEvent

def build(file_id: str, db: Session):
    # Detections are already added to the timeline by detectors.
    # Add extracted files to the timeline as file transfer events.
    
    files = db.query(ExtractedFile).filter(ExtractedFile.pcap_id == file_id).all()
    for f in files:
        db.add(TimelineEvent(
            pcap_id=file_id,
            timestamp=f.extraction_time,
            src_ip="Unknown", # Would need correlation with session
            dst_ip="Unknown",
            protocol=f.protocol,
            event_type="file_transfer",
            severity="low",
            description=f"File extracted: {f.filename} ({f.mime_type})",
            evidence=f"MD5: {f.md5_hash}"
        ))
    db.commit()
