from database import SessionLocal, engine, Base
from models import User, UserRole
from auth import get_password_hash

Base.metadata.create_all(bind=engine)
db = SessionLocal()

if db.query(User).count() == 0:
    admin = User(
        username="admin",
        email="admin@tracelock.com",
        password_hash=get_password_hash("admin123"),
        role=UserRole.ADMIN,
        is_active=True
    )
    analyst = User(
        username="analyst",
        email="analyst@tracelock.com",
        password_hash=get_password_hash("analyst123"),
        role=UserRole.ANALYST,
        is_active=True
    )
    viewer = User(
        username="viewer",
        email="viewer@tracelock.com",
        password_hash=get_password_hash("viewer123"),
        role=UserRole.VIEWER,
        is_active=True
    )
    
    db.add_all([admin, analyst, viewer])
    db.commit()
    print("Users created!")
    print("Admin: admin / admin123")
    print("Analyst: analyst / analyst123")
    print("Viewer: viewer / viewer123")
else:
    print("Users already exist")

db.close()