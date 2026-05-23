import dpkt
import os
import hashlib
import math
from sqlalchemy.orm import Session
from models.database import ExtractedFile


def calculate_entropy(data):
    """Calculate the Shannon entropy of a byte sequence."""
    if not data:
        return 0.0

    entropy = 0
    for x in range(256):
        p_x = float(data.count(bytes([x]))) / len(data)
        if p_x > 0:
            entropy += -p_x * math.log(p_x, 2)
    return entropy


def extract(file_path: str, file_id: str, db: Session):
    """Scan a packet capture for HTTP payloads and save reconstructed files."""
    extract_dir = f"data/extracted/{file_id}"
    os.makedirs(extract_dir, exist_ok=True)

    file_counter = 0
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
                    if not isinstance(ip.data, dpkt.tcp.TCP):
                        continue

                    tcp = ip.data
                    if len(tcp.data) == 0:
                        continue

                    # Very basic HTTP response carving from TCP payloads.
                    if tcp.data.startswith(b'HTTP/'):
                        try:
                            http = dpkt.http.Response(tcp.data)
                            if http.body and len(http.body) > 100:
                                file_counter += 1

                                ct = http.headers.get('content-type', '')
                                ext = ".bin"
                                if 'image/jpeg' in ct:
                                    ext = ".jpg"
                                elif 'image/png' in ct:
                                    ext = ".png"
                                elif 'application/pdf' in ct:
                                    ext = ".pdf"
                                elif 'application/zip' in ct:
                                    ext = ".zip"
                                elif 'text/html' in ct:
                                    ext = ".html"
                                elif 'application/x-msdownload' in ct:
                                    ext = ".exe"
                                elif 'application/json' in ct:
                                    ext = ".json"
                                elif 'text/plain' in ct:
                                    ext = ".txt"

                                filename = f"carved_file_{file_counter}{ext}"
                                full_path = os.path.join(extract_dir, filename)

                                with open(full_path, "wb") as out:
                                    out.write(http.body)

                                md5 = hashlib.md5(http.body).hexdigest()
                                sha256 = hashlib.sha256(http.body).hexdigest()
                                ent = calculate_entropy(http.body)

                                db.add(ExtractedFile(
                                    pcap_id=file_id,
                                    filename=filename,
                                    file_path=full_path,
                                    protocol="HTTP",
                                    md5_hash=md5,
                                    sha256_hash=sha256,
                                    mime_type=ct or "application/octet-stream",
                                    entropy=ent
                                ))
                        except Exception:
                            # Skip malformed HTTP payloads and continue processing.
                            pass
                except Exception:
                    # Ignore packet parsing errors and keep scanning.
                    continue
            db.commit()
    except Exception as e:
        print(f"File Extractor error: {e}")
