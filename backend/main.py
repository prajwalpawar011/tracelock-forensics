from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import hashlib
import os
from datetime import datetime
from pathlib import Path
import mimetypes

from database import engine, Base, get_db
from models import Evidence, TransferLog, User, UserRole, EvidenceStatus
from auth import get_current_user, role_required, create_access_token, verify_password, get_password_hash

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="TraceLock Forensic API", version="2.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory
UPLOAD_DIR = Path("evidence_storage")
UPLOAD_DIR.mkdir(exist_ok=True)

# ==================== AUTHENTICATION ENDPOINTS ====================

@app.post("/api/auth/login")
def login(username: str, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Account disabled")
    
    user.last_login = datetime.now()
    db.commit()
    
    access_token = create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
        "role": user.role.value
    }

@app.post("/api/auth/register")
def register(
    username: str, 
    email: str, 
    password: str, 
    role: str = "viewer", 
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["admin"]))
):
    existing = db.query(User).filter(
        (User.username == username) | (User.email == email)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    try:
        user_role = UserRole(role.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role. Must be: viewer, analyst, admin")
    
    hashed_password = get_password_hash(password)
    new_user = User(
        username=username,
        email=email,
        password_hash=hashed_password,
        role=user_role,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": "User created successfully", 
        "user_id": new_user.id, 
        "username": new_user.username,
        "role": new_user.role.value
    }

# ==================== EVIDENCE ENDPOINTS ====================

@app.get("/api/evidence")
def get_all_evidence(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    evidence = db.query(Evidence).filter(Evidence.deleted_at.is_(None)).order_by(Evidence.created_at.desc()).all()
    return [
        {
            "id": e.id,
            "case_number": e.case_number,
            "description": e.description,
            "category": e.category,
            "hash_value": e.hash_value,
            "status": e.status.value,
            "file_name": e.file_name,
            "file_size": e.file_size,
            "created_at": e.created_at
        } for e in evidence
    ]

@app.post("/api/evidence", status_code=status.HTTP_201_CREATED)
def create_evidence(
    case_number: str,
    description: str,
    category: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["analyst", "admin"]))
):
    initial_hash = hashlib.sha256(f"{case_number}-{datetime.now().isoformat()}".encode()).hexdigest()
    
    new_evidence = Evidence(
        case_number=case_number,
        description=description,
        category=category,
        hash_value=initial_hash,
        status=EvidenceStatus.INTAKE,
        created_by=current_user.id
    )
    
    db.add(new_evidence)
    db.commit()
    db.refresh(new_evidence)
    
    log = TransferLog(
        evidence_id=new_evidence.id,
        user_id=current_user.id,
        action=f"Evidence created with case number: {case_number}"
    )
    db.add(log)
    db.commit()
    
    return {
        "id": new_evidence.id,
        "case_number": new_evidence.case_number,
        "description": new_evidence.description,
        "category": new_evidence.category,
        "hash_value": new_evidence.hash_value,
        "status": new_evidence.status.value,
        "created_at": new_evidence.created_at
    }

@app.patch("/api/evidence/{evidence_id}/status")
def update_status(
    evidence_id: int,
    new_status: str,
    technician: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["analyst", "admin"]))
):
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    old_status = evidence.status.value
    evidence.status = EvidenceStatus(new_status)
    
    log = TransferLog(
        evidence_id=evidence_id,
        user_id=current_user.id,
        action=f"Status changed from {old_status} to {new_status} by {technician}"
    )
    db.add(log)
    db.commit()
    
    return {"message": "Status updated", "old_status": old_status, "new_status": new_status}

@app.post("/api/evidence/{evidence_id}/upload")
async def upload_file(
    evidence_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["analyst", "admin"]))
):
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    content = await file.read()
    file_hash = hashlib.sha256(content).hexdigest()
    
    # Save file with consistent naming
    file_extension = Path(file.filename).suffix
    safe_filename = f"evidence_{evidence_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{file_extension}"
    file_path = UPLOAD_DIR / safe_filename
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    evidence.hash_value = file_hash
    evidence.file_name = file.filename
    evidence.file_path = str(file_path)
    evidence.file_size = len(content)
    
    log = TransferLog(
        evidence_id=evidence_id,
        user_id=current_user.id,
        action=f"File uploaded: {file.filename}"
    )
    db.add(log)
    db.commit()
    
    return {"message": "File uploaded", "hash": file_hash, "size": len(content)}

# ===== FILE PREVIEW ENDPOINT =====
@app.get("/api/evidence/{evidence_id}/file")
def get_evidence_file(
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get evidence file for preview"""
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    if not evidence.file_path or not Path(evidence.file_path).exists():
        raise HTTPException(status_code=404, detail="File not found on server")
    
    # Determine media type
    file_extension = Path(evidence.file_name).suffix.lower() if evidence.file_name else ''
    media_type_map = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.gif': 'image/gif', '.bmp': 'image/bmp', '.webp': 'image/webp',
        '.svg': 'image/svg+xml', '.pdf': 'application/pdf',
        '.txt': 'text/plain', '.json': 'application/json',
        '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
    media_type = media_type_map.get(file_extension, 'application/octet-stream')
    
    return FileResponse(
        path=evidence.file_path,
        filename=evidence.file_name,
        media_type=media_type
    )

# ===== EVIDENCE DETAILS =====
@app.get("/api/evidence/{evidence_id}/details")
def get_evidence_details(
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    logs = db.query(TransferLog).filter(
        TransferLog.evidence_id == evidence_id
    ).order_by(TransferLog.timestamp.desc()).all()
    
    creator = db.query(User).filter(User.id == evidence.created_by).first()
    
    return {
        "case_number": evidence.case_number,
        "description": evidence.description,
        "category": evidence.category,
        "hash": evidence.hash_value,
        "status": evidence.status.value,
        "file_name": evidence.file_name,
        "file_size": evidence.file_size,
        "created_at": evidence.created_at,
        "created_by": creator.username if creator else "Unknown",
        "history": [
            {
                "action": log.action,
                "technician": db.query(User).filter(User.id == log.user_id).first().username if log.user_id else "System",
                "timestamp": log.timestamp
            } for log in logs
        ]
    }

# ===== DELETE EVIDENCE =====
@app.delete("/api/evidence/{evidence_id}")
def delete_evidence(
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["admin"]))
):
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    # Delete file if exists
    if evidence.file_path and Path(evidence.file_path).exists():
        Path(evidence.file_path).unlink()
    
    evidence.deleted_at = datetime.now()
    
    log = TransferLog(
        evidence_id=evidence_id,
        user_id=current_user.id,
        action=f"Evidence deleted by {current_user.username}"
    )
    db.add(log)
    db.commit()
    
    return {"message": "Evidence deleted"}

# ==================== ADMIN USER MANAGEMENT ====================

@app.get("/api/admin/users")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["admin"]))
):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role.value,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "last_login": u.last_login
        } for u in users
    ]

@app.patch("/api/admin/users/{user_id}/role")
def update_user_role(
    user_id: int,
    new_role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["admin"]))
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        user.role = UserRole(new_role.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": "User role updated successfully",
        "user_id": user.id,
        "username": user.username,
        "new_role": user.role.value
    }

@app.delete("/api/admin/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["admin"]))
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return {
        "message": "User deleted successfully",
        "user_id": user_id,
        "username": user.username
    }

# ==================== ROOT ENDPOINT ====================

@app.get("/")
def home():
    return {"message": "TraceLock Forensic Backend Online", "status": "operational"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)