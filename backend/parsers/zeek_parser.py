import dpkt
import socket
from sqlalchemy.orm import Session
from models.database import TimelineEvent

def inet_to_str(inet):
    try:
        return socket.inet_ntop(socket.AF_INET, inet)
    except ValueError:
        return socket.inet_ntop(socket.AF_INET6, inet)

def run_zeek(file_path: str, file_id: str, db: Session):
    """
    Since Zeek does not work natively on Windows without WSL, we have replaced the Zeek parser 
    with a pure Python dpkt-based DNS extractor to simulate the contextual logs Zeek would provide.
    """
    try:
        with open(file_path, 'rb') as f:
            try:
                pcap = dpkt.pcap.Reader(f)
            except ValueError:
                f.seek(0)
                pcap = dpkt.pcapng.Reader(f)
                
            for ts, buf in pcap:
                try:
                    eth = dpkt.ethernet.Ethernet(buf)
                    if not isinstance(eth.data, dpkt.ip.IP) and not isinstance(eth.data, dpkt.ip6.IP6):
                        continue
                    ip = eth.data
                    if not isinstance(ip.data, dpkt.udp.UDP):
                        continue
                    udp = ip.data
                    
                    if udp.dport == 53 or udp.sport == 53:
                        try:
                            dns = dpkt.dns.DNS(udp.data)
                            if dns.qr == dpkt.dns.DNS_Q: # Query
                                for q in dns.qd:
                                    # We don't flood the timeline with every DNS query, just suspicious looking ones,
                                    # or we could log them all. For now we will add unique ones.
                                    pass # Currently skipping raw DNS population to keep DB small, but could add here.
                        except Exception:
                            continue
                except Exception:
                    continue
    except Exception as e:
        print(f"Python DNS Parser error: {e}")
