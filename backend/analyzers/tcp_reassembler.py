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


def guess_protocol(packet_type: str, sport: int, dport: int, payload: bytes) -> str:
    payload = payload or b''
    if packet_type == 'TCP':
        http_signatures = [b'HTTP/', b'GET ', b'POST ', b'PUT ', b'DELETE ', b'HEAD ', b'OPTIONS ', b'PATCH ', b'CONNECT ']
        if any(payload.startswith(sig) for sig in http_signatures):
            return 'HTTP'
        if sport in (80, 8080, 8000) or dport in (80, 8080, 8000):
            return 'HTTP'
        if sport == 443 or dport == 443 or payload.startswith(b'\x16\x03'):
            return 'HTTPS'
        if sport == 22 or dport == 22:
            return 'SSH'
        if sport == 445 or dport == 445:
            return 'SMB'
        return 'TCP'
    if packet_type == 'UDP':
        if sport == 53 or dport == 53:
            return 'DNS'
        if sport == 123 or dport == 123:
            return 'NTP'
        if sport == 69 or dport == 69:
            return 'TFTP'
        if sport in (67, 68) or dport in (67, 68):
            return 'DHCP'
        if sport == 161 or dport == 161:
            return 'SNMP'
        return 'UDP'
    return 'UNKNOWN'


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
                packet = ip.data
                packet_type = None
                payload = b''

                if isinstance(packet, dpkt.tcp.TCP):
                    packet_type = 'TCP'
                    payload = packet.data
                elif isinstance(packet, dpkt.udp.UDP):
                    packet_type = 'UDP'
                    payload = packet.data
                else:
                    continue

                src_ip = inet_to_str(ip.src)
                dst_ip = inet_to_str(ip.dst)
                src_port = packet.sport
                dst_port = packet.dport
                protocol = guess_protocol(packet_type, src_port, dst_port, payload)

                key = (protocol, tuple(sorted([f"{src_ip}:{src_port}", f"{dst_ip}:{dst_port}"])))

                if key not in sessions:
                    sessions[key] = {
                        "src_ip": src_ip,
                        "dst_ip": dst_ip,
                        "src_port": src_port,
                        "dst_port": dst_port,
                        "protocol": protocol,
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
                protocol=v["protocol"],
                packet_count=v["packet_count"],
                byte_count=v["byte_count"],
                session_duration=v["end_time"] - v["start_time"],
                start_time=datetime.fromtimestamp(v["start_time"])
            ))
        db.commit()
    except Exception as e:
        print(f"TCP DB insert error: {e}")
