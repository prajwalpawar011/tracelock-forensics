from database import SessionLocal
from models import User, UserRole
from auth import get_password_hash

db = SessionLocal()

# Check if users exist
users = db.query(User).all()
print(f"Current users: {len(users)}")

# Create admin user
admin = User(
    username="admin",
    email="admin@tracelock.com",
    password_hash=get_password_hash("admin123"),
    role=UserRole.ADMIN,
    is_active=True
)

# Create analyst user
analyst = User(
    username="analyst",
    email="analyst@tracelock.com",
    password_hash=get_password_hash("analyst123"),
    role=UserRole.ANALYST,
    is_active=True
)

# Create viewer user
viewer = User(
    username="viewer",
    email="viewer@tracelock.com",
    password_hash=get_password_hash("viewer123"),
    role=UserRole.VIEWER,
    is_active=True
)

# Add all users
db.add_all([admin, analyst, viewer])
db.commit()

print("Users created successfully!")
print("Admin: admin / admin123")
print("Analyst: analyst / analyst123")
print("Viewer: viewer / viewer123")

db.close()