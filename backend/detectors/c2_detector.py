from sqlalchemy.orm import Session
from models.database import TCPSession, TimelineEvent
from sqlalchemy import func

def detect(file_id: str, db: Session):
    # Very basic C2 detection: look for periodic connections or large number of small connections
    # to the same destination
    
    beacon_query = db.query(
        TCPSession.src_ip, TCPSession.dst_ip, TCPSession.dst_port,
        func.count(TCPSession.id).label("conn_count")
    ).filter(TCPSession.pcap_id == file_id).group_by(
        TCPSession.src_ip, TCPSession.dst_ip, TCPSession.dst_port
    ).having(func.count(TCPSession.id) > 50).all()
    
    for src, dst, port, count in beacon_query:
        db.add(TimelineEvent(
            pcap_id=file_id,
            timestamp=db.query(func.min(TCPSession.start_time)).filter(TCPSession.src_ip == src, TCPSession.dst_ip == dst).scalar(),
            src_ip=src,
            dst_ip=dst,
            protocol="TCP",
            event_type="c2_beacon",
            severity="high",
            description=f"Possible C2 beaconing behavior: {src} connected to {dst}:{port} {count} times.",
            evidence=f"{count} connections to same dst/port"
        ))
        
    db.commit()
