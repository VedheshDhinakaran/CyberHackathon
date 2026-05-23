# NetRecon Forensics Workbench

NetRecon Forensics Workbench is a production-grade network forensic investigation suite tailored for cybersecurity analysts, SOCs, and academic demonstrations. It processes large PCAP files to automatically extract TCP streams, reconstruct transferred files, detect attacker activity, reconstruct attack timelines, and extract Indicators of Compromise (IOCs).

## Features

- **Automated PCAP Ingestion:** Upload PCAP/PCAPNG files via a modern UI and process them asynchronously.
- **TCP Stream Reassembly:** Automatically reconstructs full bidirectional TCP flows with statistics using `tshark`.
- **File Reconstruction Engine:** Automatically rebuilds HTTP, SMB, and TFTP downloads. Generates hashes and calculates entropy.
- **Attack Detection:** Uses behavioral analysis to detect Port Scans, Exploit Attempts, and C2 Beacons.
- **Timeline Reconstruction:** Automatically generates a chronological timeline of the attack, classifying events by severity.
- **Zeek Integration:** Natively invokes Zeek (if available) to parse network streams and generate rich contextual logs.
- **Modern Dashboard UI:** A React + TailwindCSS driven dashboard featuring a dark mode UI, smooth animations, and SOC-inspired data tables.

## Architecture

NetRecon is split into two main components:
- **Backend:** A FastAPI-based Python 3.11 service utilizing `Scapy`, `tshark`, and `Zeek` for deep packet inspection, with an SQLite database for storing metadata and reconstructed state.
- **Frontend:** A React + Vite frontend utilizing TailwindCSS, providing dynamic interfaces for investigators.

### System Requirements

- Windows, Linux, or macOS.
- **Python 3.11+**
- **Node.js 18+**
- **Wireshark / tshark:** Must be installed and accessible in your system PATH. 
- *(Optional) Zeek: If installed, the backend will utilize it for additional context.*

## Getting Started

### 1. Prerequisites (Windows)
1. Install [Wireshark](https://www.wireshark.org/). During installation, ensure `tshark` is selected. 
2. Add the Wireshark directory (e.g., `C:\Program Files\Wireshark`) to your System Environment Variables (PATH).
3. Ensure Python and Node.js are installed.

### 2. First-Time Setup
Open your terminal in the project directory:

**Setup Backend:**
```powershell
cd backend
pip install -r requirements.txt
cd ..
```

**Setup Frontend:**
```powershell
cd frontend
npm install
cd ..
```

### 3. Running the Application
We've provided a simple startup script to launch both the frontend and backend simultaneously.

```powershell
.\start.ps1
```

*Alternatively, you can manually run them in separate terminals:*
* **Backend:** `cd backend` -> `uvicorn main:app --host 0.0.0.0 --port 8000`
* **Frontend:** `cd frontend` -> `npm run dev`

## Usage Workflow

1. Open the Dashboard in your browser (usually `http://localhost:5173`).
2. Drag and drop a malicious PCAP file into the Upload section.
3. The platform will automatically begin parsing, utilizing Zeek and tshark in the background.
4. Watch the progress bar as the system runs stream reassembly, file extraction, and timeline building.
5. Once complete, review the Attack Timeline to understand the chronological sequence of the attack.
6. Check the Extracted Files panel to download payloads, and the IOC Panel to export malicious IPs and hashes.

## Future Scope

- **Sigma/YARA Integration:** Add native rule matching for payloads.
- **GeoIP Mapping:** Plot suspicious IPs on a global map.
- **Suricata Integration:** Import alerts directly from Suricata logs.
- **MITRE ATT&CK Mapping:** Map detected behaviors to ATT&CK tactics and techniques.

## License

MIT License
