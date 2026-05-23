import dpkt
import socket
from sqlalchemy.orm import Session
from models.database import TCPSession
from datetime import datetime

def inet_to_str(inet):
    try:
        return socket.inet_ntop(socket.AF_INET, inet)
    except ValueError:
        return socket.inet_ntop(socket.AF_INET6, inet)

def process(file_path: str, file_id: str, db: Session):
    sessions = {}
    
    try:
        with open(file_path, 'rb') as f:
            # Handle both PCAP and PCAPNG
            try:
                pcap = dpkt.pcap.Reader(f)
            except ValueError:
                f.seek(0)
                pcap = dpkt.pcapng.Reader(f)
                
            for ts, buf in pcap:
                try:
                    eth = dpkt.ethernet.Ethernet(buf)
                except Exception:
                    continue
                
                # Check for IP
                if not isinstance(eth.data, dpkt.ip.IP) and not isinstance(eth.data, dpkt.ip6.IP6):
                    continue
                    
                ip = eth.data
                
                # Check for TCP
                if not isinstance(ip.data, dpkt.tcp.TCP):
                    continue
                    
                tcp = ip.data
                
                src_ip = inet_to_str(ip.src)
                dst_ip = inet_to_str(ip.dst)
                src_port = tcp.sport
                dst_port = tcp.dport
                
                key = tuple(sorted([f"{src_ip}:{src_port}", f"{dst_ip}:{dst_port}"]))
                
                if key not in sessions:
                    sessions[key] = {
                        "src_ip": src_ip, "dst_ip": dst_ip,
                        "src_port": src_port, "dst_port": dst_port,
                        "packet_count": 0,
                        "byte_count": 0,
                        "start_time": ts,
                        "end_time": ts
                    }
                    
                sessions[key]["packet_count"] += 1
                sessions[key]["byte_count"] += len(buf)
                sessions[key]["end_time"] = max(sessions[key]["end_time"], ts)
                
    except Exception as e:
        print(f"TCP Reassembler error: {e}")
        return

    # Bulk insert
    try:
        for k, v in sessions.items():
            db.add(TCPSession(
                pcap_id=file_id,
                src_ip=v["src_ip"],
                dst_ip=v["dst_ip"],
                src_port=v["src_port"],
                dst_port=v["dst_port"],
                protocol="TCP",
                packet_count=v["packet_count"],
                byte_count=v["byte_count"],
                session_duration=v["end_time"] - v["start_time"],
                start_time=datetime.fromtimestamp(v["start_time"])
            ))
        db.commit()
    except Exception as e:
        print(f"TCP DB insert error: {e}")
