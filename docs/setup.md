# Setup Guide

This document describes how to install, configure, and run the CyberHackathon network forensic workbench.

## System Requirements

- Windows, Linux, or macOS
- Python 3.11+
- Node.js 18+
- `pip` and `npm`
- `tshark` (from Wireshark) installed and available on `PATH`
- Optional: `zeek` installed for richer analysis

## Repository Structure

- `backend/` — FastAPI application, packet analyzers, database models, detectors, and report generation.
- `frontend/` — React + Vite dashboard UI.
- `data/` — Storage for uploaded captures, extracted artifacts, Zeek logs, and SQLite database.
- `docs/` — Documentation for setup and threat model.
- `examples/` — Example PCAP files and sample output reports.

## Install Dependencies

### Backend

1. Open a terminal in the repository root.
2. Change into the backend folder:

```powershell
cd backend
```

3. Install Python dependencies:

```powershell
pip install -r requirements.txt
```

### Frontend

1. Open a terminal in the repository root.
2. Change into the frontend folder:

```powershell
cd frontend
```

3. Install Node.js dependencies:

```powershell
npm install
```

## Configure Required Tools

### Installing tshark

`tshark` is required for packet parsing and stream reassembly.

- Windows: install Wireshark and enable `tshark` during installation.
- Linux/macOS: install Wireshark or `tshark` via package manager.

Verify installation:

```powershell
where tshark
# or on Linux/macOS
which tshark
```

### Optional: Installing Zeek

Zeek is optional but recommended for advanced protocol extraction.

Verify Zeek installation:

```powershell
zeek --version
```

## Initialize the Database

The backend automatically creates the SQLite database when it starts. No manual schema migration is required.

The database file is stored under `backend/data/db/netrecon.db`.

## Run the Application

### Recommended: Use startup script

From the repository root run:

```powershell
.\start.ps1
```

This script should launch the backend and frontend together.

### Manual Startup

#### Backend

```powershell
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Frontend

```powershell
cd frontend
npm run dev
```

### Accessing the UI

Open the browser at:

```text
http://localhost:5173
```

The frontend expects the backend API to be reachable at `http://localhost:8000`.

## Common Commands

### Rebuild frontend for production

```powershell
cd frontend
npm run build
```

### Run frontend dev server only

```powershell
cd frontend
npm run dev
```

### Run backend only

```powershell
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Troubleshooting

### Frontend cannot connect to backend

- Confirm the backend is running on port `8000`.
- Confirm the backend URL in `frontend/src/pages/Dashboard.jsx` uses `http://localhost:8000`.

### `tshark` not found

- Ensure Wireshark is installed.
- Add the Wireshark install directory to the system `PATH`.

### Python dependency issues

- Reinstall backend dependencies:

```powershell
cd backend
pip install -r requirements.txt
```

### Node dependency issues

- Reinstall frontend dependencies:

```powershell
cd frontend
npm install
```

## Notes

- Uploaded PCAP files are stored in `backend/data/uploads/`.
- Extracted artifacts are stored in `backend/data/extracted/`.
- This project is intended as a forensic analysis workbench rather than a hardened network defense product.
