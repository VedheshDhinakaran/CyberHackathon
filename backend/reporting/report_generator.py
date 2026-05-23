import io
from sqlalchemy.orm import Session
from models import database
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf_report(file_id: str, db: Session):
    pcap = db.query(database.UploadedPcap).filter(database.UploadedPcap.id == file_id).first()
    events = db.query(database.TimelineEvent).filter(database.TimelineEvent.pcap_id == file_id).all()
    iocs = db.query(database.Indicator).filter(database.Indicator.pcap_id == file_id).all()
    files = db.query(database.ExtractedFile).filter(database.ExtractedFile.pcap_id == file_id).all()
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    
    title_style = styles['Heading1']
    title_style.textColor = colors.HexColor("#1A233A")
    heading_style = styles['Heading2']
    heading_style.textColor = colors.HexColor("#3B82F6")
    normal_style = styles['Normal']
    
    elements = []
    
    # Title
    elements.append(Paragraph("NetRecon Executive Forensic Report", title_style))
    elements.append(Spacer(1, 12))
    
    # Summary
    elements.append(Paragraph("Investigation Summary", heading_style))
    summary_data = [
        ["Investigation ID", file_id],
        ["Original File", pcap.filename if pcap else "Unknown"],
        ["Total Timeline Events", str(len(events))],
        ["Indicators of Compromise", str(len(iocs))],
        ["Files Extracted", str(len(files))]
    ]
    t = Table(summary_data, colWidths=[150, 300])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#F3F4F6")),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor("#111827")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#E5E7EB"))
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))
    
    # High Severity Events
    elements.append(Paragraph("Critical & High Severity Events", heading_style))
    high_events = [e for e in events if e.severity in ['high', 'critical']]
    if high_events:
        event_data = [["Time", "Type", "Source IP", "Description"]]
        for e in high_events:
            event_data.append([
                e.timestamp.strftime("%Y-%m-%d %H:%M:%S") if e.timestamp else "N/A",
                e.event_type.upper(),
                e.src_ip,
                e.description[:50] + "..." if len(e.description) > 50 else e.description
            ])
        t_events = Table(event_data, colWidths=[100, 80, 100, 200])
        t_events.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#EF4444")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#E5E7EB"))
        ]))
        elements.append(t_events)
    else:
        elements.append(Paragraph("No critical or high severity events detected.", normal_style))
    
    elements.append(Spacer(1, 20))
    
    # IOCs
    elements.append(Paragraph("Indicators of Compromise (IOCs)", heading_style))
    if iocs:
        ioc_data = [["Type", "Value", "Description"]]
        for i in iocs:
            ioc_data.append([
                i.ioc_type.upper(),
                i.value,
                i.description[:50] + "..." if len(i.description) > 50 else i.description
            ])
        t_iocs = Table(ioc_data, colWidths=[80, 200, 200])
        t_iocs.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F59E0B")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#E5E7EB"))
        ]))
        elements.append(t_iocs)
    else:
        elements.append(Paragraph("No IOCs detected.", normal_style))
        
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

def generate_json_report(file_id: str, db: Session):
    pcap = db.query(database.UploadedPcap).filter(database.UploadedPcap.id == file_id).first()
    events = db.query(database.TimelineEvent).filter(database.TimelineEvent.pcap_id == file_id).all()
    iocs = db.query(database.Indicator).filter(database.Indicator.pcap_id == file_id).all()
    files = db.query(database.ExtractedFile).filter(database.ExtractedFile.pcap_id == file_id).all()
    
    return {
        "investigation_id": file_id,
        "filename": pcap.filename if pcap else "Unknown",
        "events": [{
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            "type": e.event_type,
            "severity": e.severity,
            "src_ip": e.src_ip,
            "dst_ip": e.dst_ip,
            "description": e.description
        } for e in events],
        "iocs": [{
            "type": i.ioc_type,
            "value": i.value,
            "description": i.description
        } for i in iocs],
        "extracted_files": [{
            "filename": f.filename,
            "md5": f.md5_hash,
            "mime_type": f.mime_type
        } for f in files]
    }
