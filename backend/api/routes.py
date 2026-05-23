from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from models import database
from services import ingestion
import os

router = APIRouter()

@router.post("/upload")
async def upload_raw_pcap(request: Request, background_tasks: BackgroundTasks, filename: str, db: Session = Depends(database.get_db)):
    """Accept raw PCAP or PCAPNG uploads and schedule background analysis."""
    if not filename.endswith(".pcap") and not filename.endswith(".pcapng"):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a PCAP or PCAPNG file.")

    import uuid
    file_id = str(uuid.uuid4())
    upload_dir = "data/uploads"
    file_path = os.path.join(upload_dir, f"{file_id}_{filename}")

    # Save the raw request body into a uniquely named file.
    with open(file_path, "wb") as buffer:
        async for chunk in request.stream():
            buffer.write(chunk)

    size_bytes = os.path.getsize(file_path)

    # Persist upload metadata and start asynchronous analysis.
    pcap_record = database.UploadedPcap(
        id=file_id,
        filename=filename,
        file_path=file_path,
        size_bytes=size_bytes,
        status="processing",
        progress=0.0
    )
    db.add(pcap_record)
    db.commit()

    background_tasks.add_task(ingestion.process_pcap, file_id, file_path)

    return {"status": "success", "file_id": file_id, "message": "PCAP uploaded and analysis started."}

@router.get("/analysis/{file_id}")
def get_analysis_status(file_id: str, db: Session = Depends(database.get_db)):
    """Return the current processing status for a given upload."""
    job = db.query(database.UploadedPcap).filter(database.UploadedPcap.id == file_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job not found")
    return {"id": job.id, "filename": job.filename, "status": job.status, "progress": job.progress}

@router.get("/timeline/{file_id}")
def get_timeline(file_id: str, db: Session = Depends(database.get_db)):
    """Return ordered timeline events extracted from the capture."""
    events = db.query(database.TimelineEvent).filter(database.TimelineEvent.pcap_id == file_id).order_by(database.TimelineEvent.timestamp).all()
    return events

@router.get("/files/{file_id}")
def get_extracted_files(file_id: str, db: Session = Depends(database.get_db)):
    """Return reconstructed file metadata for the capture."""
    files = db.query(database.ExtractedFile).filter(database.ExtractedFile.pcap_id == file_id).all()
    return files

@router.get("/iocs/{file_id}")
def get_iocs(file_id: str, db: Session = Depends(database.get_db)):
    """Return Indicators of Compromise extracted for the capture."""
    iocs = db.query(database.Indicator).filter(database.Indicator.pcap_id == file_id).all()
    return iocs

@router.get("/sessions/{file_id}")
def get_sessions(file_id: str, db: Session = Depends(database.get_db)):
    """Return stored session metadata for the capture."""
    sessions = db.query(database.TCPSession).filter(database.TCPSession.pcap_id == file_id).all()
    return sessions

@router.get("/hosts/{file_id}")
def get_hosts(file_id: str, db: Session = Depends(database.get_db)):
    """Return suspicious host data related to the capture."""
    hosts = db.query(database.SuspiciousHost).filter(database.SuspiciousHost.pcap_id == file_id).all()
    return hosts

@router.get("/report/{file_id}/pdf")
def get_report_pdf(file_id: str, db: Session = Depends(database.get_db)):
    """Generate a PDF report for the analysis results."""
    from reporting import report_generator
    from fastapi.responses import Response
    pdf_bytes = report_generator.generate_pdf_report(file_id, db)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=NetRecon_Report_{file_id}.pdf"}
    )

@router.get("/report/{file_id}/json")
def get_report_json(file_id: str, db: Session = Depends(database.get_db)):
    """Generate a JSON report for the analysis results."""
    from reporting import report_generator
    return report_generator.generate_json_report(file_id, db)
