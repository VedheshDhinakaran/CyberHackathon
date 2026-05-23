from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from models import database
from api import routes

app = FastAPI(title="NetRecon Forensics Workbench API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
app.include_router(routes.router)

@app.on_event("startup")
def on_startup():
    database.init_db()
    # Create necessary directories
    os.makedirs("data/uploads", exist_ok=True)
    os.makedirs("data/extracted", exist_ok=True)
    os.makedirs("data/zeek", exist_ok=True)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
