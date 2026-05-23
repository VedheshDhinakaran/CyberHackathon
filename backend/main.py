from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from models import database
from api import routes

# Create the FastAPI app instance used by the backend service.
# This app exposes REST endpoints for analysis status, timeline data,
# file metadata, detected IOCs, and session information.
app = FastAPI(title="NetRecon Forensics Workbench API")

# Enable permissive CORS for the frontend dashboard during local development.
# In a production deployment, this should be restricted to trusted origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the main API routes defined in backend/api/routes.py.
app.include_router(routes.router)

@app.on_event("startup")
def on_startup():
    # Ensure the SQLite database and required directories exist before serving requests.
    database.init_db()
    os.makedirs("data/uploads", exist_ok=True)
    os.makedirs("data/extracted", exist_ok=True)
    os.makedirs("data/zeek", exist_ok=True)

if __name__ == "__main__":
    # Run the FastAPI application with reload enabled for development.
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
