# CyberHackathon — Network Forensics Workbench

CyberHackathon is a network forensic analysis platform for packet capture (PCAP) investigation. It combines a Python FastAPI backend with a React + Vite frontend to ingest PCAP/PCAPNG files, reassemble network sessions, reconstruct transferred files, detect attacker behavior, and build an attack timeline.

## Key Features

- **PCAP Ingestion** — Upload captures through a modern web dashboard.
- **Session Analysis** — Reassemble TCP/UDP sessions and identify protocol flows.
- **File Extraction** — Extract HTTP payloads and reconstructed file objects.
- **Attack Detection** — Spot port scans, exploit attempts, C2 beacons, and suspicious traffic.
- **Timeline Generation** — Build a chronological sequence of detected events.
- **IOC Extraction** — Collect IPs, domains, hashes, and other indicators.

## Repository Structure

- `backend/` — FastAPI server, DB models, analyzers, detectors, parsers, and reporting logic.
- `frontend/` — React + Vite dashboard, data visualizations, and user interface.
- `data/` — Storage for uploads, extracted artifacts, Zeek logs, and database files.
- `docs/` — Documentation and examples.
- `examples/` — Example PCAP files and sample reports.
- `start.ps1` — Convenience script to launch the application.

## Requirements

- Python 3.11+
- Node.js 18+
- `pip` and `npm`
- `tshark` installed and available on `PATH`
- Optional: `zeek` for richer network context

## Setup

### Backend

```powershell
cd backend
pip install -r requirements.txt
```

### Frontend

```powershell
cd frontend
npm install
```

## Running the Project

### Recommended

From the repository root:

```powershell
.\start.ps1
```

### Manual Startup

Backend:

```powershell
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

Frontend:

```powershell
cd frontend
npm run dev
```

The frontend defaults to `http://localhost:5173` and communicates with the backend at `http://localhost:8000`.

## Usage

1. Open the dashboard in your browser.
2. Upload a PCAP or PCAPNG file.
3. Wait for the analysis pipeline to complete.
4. Review the dashboard tabs:
   - **Overview** — attack summary and detection statistics
   - **Timeline** — ordered event history
   - **Network Flow** — session and protocol visualization
   - **Sessions** — detailed TCP/UDP session list
   - **Files** — extracted payloads and metadata
   - **IOCs** — collected indicators of compromise

## Development Notes

- `backend/main.py` starts the FastAPI service.
- `backend/models/database.py` defines the SQLite schema.
- `backend/analyzers/tcp_reassembler.py` handles session reconstruction.
- `frontend/src/pages/Dashboard.jsx` orchestrates data fetching and tabbed views.
- `frontend/src/components/NetworkFlowChart.jsx` renders protocol/session analytics.

## Troubleshooting

- If uploads fail, verify `tshark` is installed and accessible from the command line.
- If the frontend cannot reach the backend, confirm the backend is running on port `8000`.
- For Python dependency issues, reinstall backend requirements:

```powershell
cd backend
pip install -r requirements.txt
```

## Documentation

Additional project documentation is available in the `docs/` folder:

- `docs/setup.md` — detailed installation and run instructions
- `docs/threat_model.md` — attacker model, assumptions, and security considerations

## Contribution

Team Members:
Ganugapati Sai Sowmya - BL.EN.U4CSE23219
Nikhil Sanjay - BL.EN.U4CSE23239
Vedhesh Dhinakaran - BL.EN.U4CSE23257
Andrew Tom Mathew - BL.EN.U4CSE23269
. Suggested improvements include:
- additional protocol parsers
- broader file extraction support
- enhanced detection rules
- MITRE ATT&CK mapping
- threat intelligence enrichment

## License

This project is released under the MIT License.

