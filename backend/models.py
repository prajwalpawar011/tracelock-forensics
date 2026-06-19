from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class UserRole(str, enum.Enum):
    VIEWER = "viewer"
    ANALYST = "analyst"
    ADMIN = "admin"

class EvidenceStatus(str, enum.Enum):
    INTAKE = "Intake"
    SCANNING = "Scanning"
    ANALYZING = "Analyzing"
    COMPLETED = "Completed"
    ARCHIVED = "Archived"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.VIEWER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

class Evidence(Base):
    __tablename__ = "evidence"
    
    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    category = Column(String(50))
    hash_value = Column(String(64), nullable=True)
    status = Column(Enum(EvidenceStatus), default=EvidenceStatus.INTAKE)
    file_name = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=True)
    file_size = Column(BigInteger, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

class TransferLog(Base):
    __tablename__ = "transfer_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(Integer, ForeignKey("evidence.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())