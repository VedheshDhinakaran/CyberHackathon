from sqlalchemy.orm import Session
from models.database import TCPSession, TimelineEvent
from sqlalchemy import func

def detect(file_id: str, db: Session):
    # Detect Port Scans
    # Find sources that connected to many different destination ports on a single host or multiple hosts
    
    # Query: count distinct dst_ports per src_ip
    scan_query = db.query(
        TCPSession.src_ip, 
        func.count(func.distinct(TCPSession.dst_port)).label("port_count")
    ).filter(TCPSession.pcap_id == file_id).group_by(TCPSession.src_ip).having(func.count(func.distinct(TCPSession.dst_port)) > 20).all()
    
    for src_ip, port_count in scan_query:
        db.add(TimelineEvent(
            pcap_id=file_id,
            timestamp=db.query(func.min(TCPSession.start_time)).filter(TCPSession.src_ip == src_ip).scalar(),
            src_ip=src_ip,
            dst_ip="Multiple",
            protocol="TCP",
            event_type="port_scan",
            severity="medium",
            description=f"Possible port scan detected: {src_ip} scanned {port_count} distinct ports.",
            evidence=f"{port_count} distinct ports"
        ))
        
    db.commit()
