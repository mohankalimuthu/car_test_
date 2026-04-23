from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="MCQ Test Platform API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Configuration
MONGO_URL = os.getenv("MONGO_URL")
admin_email_ = os.getenv("email")
pass_email = os.getenv("email_pass")
client = AsyncIOMotorClient(MONGO_URL)
DATABASE_NAME = "mcq_platform"

db = client[DATABASE_NAME]

USERS_COLLECTION = "users"
QUESTIONS_COLLECTION = "questions"
RESULTS_COLLECTION = "results"

# Collections
users_collection = db[USERS_COLLECTION]
questions_collection = db[QUESTIONS_COLLECTION]
results_collection = db[RESULTS_COLLECTION]


# ==================== MODELS ====================

class UserRegister(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: str  # Format: YYYY-MM-DD
    internship_domain: str
    internship_role: str
    favorite_unique_name: str
    email: EmailStr


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class Question(BaseModel):
    question: str
    options: List[str]
    answer: int  # Index 0-3
    type: str  # aptitude or technical


class QuestionUpdate(BaseModel):
    question: Optional[str] = None
    options: Optional[List[str]] = None
    answer: Optional[int] = None
    type: Optional[str] = None


class TestSubmission(BaseModel):
    email: EmailStr
    aptitude_answers: List[Optional[int]]
    technical_answers: List[Optional[int]]


# ==================== HELPER FUNCTIONS ====================

def generate_password(first_name: str, birth_year: str, favorite: str, domain: str) -> str:
    """Generate password: firstName + birthYear + favoriteThing + domain"""
    return f"{first_name}{birth_year}{favorite}{domain}".replace(" ", "")


async def verify_admin(email: str, password: str) -> bool:
    """Verify admin credentials"""
    return email == admin_email_ and password == pass_email


# ==================== USER ROUTES ====================

@app.post("/api/register")
async def register_user(user: UserRegister):
    """Register a new user"""
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    birth_year = user.date_of_birth.split("-")[0]

    password = generate_password(
        user.first_name,
        birth_year,
        user.favorite_unique_name,
        user.internship_domain
    )

    user_doc = {
        "name": f"{user.first_name} {user.last_name}",
        "email": user.email,
        "domain": user.internship_domain,
        "role": user.internship_role,
        "date_of_birth": user.date_of_birth,
        "password": password,
        "aptitude_score": 0,
        "technical_score": 0,
        "total_score": 0,
        "test_completed": False,
        "created_at": datetime.utcnow()
    }

    await users_collection.insert_one(user_doc)

    return {
        "message": "Registration successful",
        "email": user.email,
        "password": password
    }


@app.post("/api/login")
async def login_user(credentials: UserLogin):
    """User login"""
    user = await users_collection.find_one({"email": credentials.email})

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user["password"] != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.get("test_completed", False):
        raise HTTPException(status_code=403, detail="Test already completed. You cannot retake the test.")

    return {
        "message": "Login successful",
        "user": {
            "name": user["name"],
            "email": user["email"],
            "domain": user["domain"],
            "role": user["role"]
        }
    }


@app.post("/api/admin/login")
async def admin_login(credentials: AdminLogin):
    """Admin login"""
    if not await verify_admin(credentials.email, credentials.password):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    return {"message": "Admin login successful"}


# ==================== QUESTION ROUTES ====================

@app.post("/api/admin/questions")
async def add_question(question: Question):
    """Add a new question"""
    question_doc = question.dict()
    question_doc["created_at"] = datetime.utcnow()

    result = await questions_collection.insert_one(question_doc)

    return {"message": "Question added successfully", "id": str(result.inserted_id)}


@app.get("/api/admin/questions")
async def get_all_questions():
    """Get all questions"""
    questions = []
    async for question in questions_collection.find():
        question["_id"] = str(question["_id"])
        questions.append(question)

    return {"questions": questions}


@app.put("/api/admin/questions/{question_id}")
async def update_question(question_id: str, question_update: QuestionUpdate):
    """Update a question"""
    from bson import ObjectId

    update_data = {k: v for k, v in question_update.dict().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await questions_collection.update_one(
        {"_id": ObjectId(question_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Question not found")

    return {"message": "Question updated successfully"}


@app.delete("/api/admin/questions/{question_id}")
async def delete_question(question_id: str):
    """Delete a question"""
    from bson import ObjectId

    result = await questions_collection.delete_one({"_id": ObjectId(question_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Question not found")

    return {"message": "Question deleted successfully"}


# ==================== TEST ROUTES ====================

@app.get("/api/questions/{question_type}")
async def get_questions_by_type(question_type: str):
    """Get questions by type"""
    if question_type not in ["aptitude", "technical"]:
        raise HTTPException(status_code=400, detail="Invalid question type")

    questions = []
    async for question in questions_collection.find({"type": question_type}):
        question_data = {
            "_id": str(question["_id"]),
            "question": question["question"],
            "options": question["options"],
            "type": question["type"]
        }
        questions.append(question_data)

    return {"questions": questions}


@app.post("/api/submit-test")
async def submit_test(submission: TestSubmission):
    """Submit test and calculate scores"""
    user = await users_collection.find_one({"email": submission.email})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("test_completed", False):
        raise HTTPException(status_code=403, detail="Test already completed")

    aptitude_questions = []
    technical_questions = []

    async for q in questions_collection.find({"type": "aptitude"}):
        aptitude_questions.append(q)

    async for q in questions_collection.find({"type": "technical"}):
        technical_questions.append(q)

    aptitude_score = 0
    technical_score = 0

    for i, answer in enumerate(submission.aptitude_answers):
        if i < len(aptitude_questions) and answer is not None:
            if answer == aptitude_questions[i]["answer"]:
                aptitude_score += 1

    for i, answer in enumerate(submission.technical_answers):
        if i < len(technical_questions) and answer is not None:
            if answer == technical_questions[i]["answer"]:
                technical_score += 1

    total_score = aptitude_score + technical_score

    await users_collection.update_one(
        {"email": submission.email},
        {
            "$set": {
                "aptitude_score": aptitude_score,
                "technical_score": technical_score,
                "total_score": total_score,
                "test_completed": True,
                "completed_at": datetime.utcnow()
            }
        }
    )

    result_doc = {
        "email": submission.email,
        "aptitude_score": aptitude_score,
        "technical_score": technical_score,
        "total_score": total_score,
        "submitted_at": datetime.utcnow()
    }
    await results_collection.insert_one(result_doc)

    return {
        "message": "Test submitted successfully",
        "aptitude_score": aptitude_score,
        "technical_score": technical_score,
        "total_score": total_score
    }


# ==================== ADMIN DASHBOARD ROUTES ====================

@app.get("/api/admin/users")
async def get_all_users():
    """Get all registered users"""
    users = []
    async for user in users_collection.find():
        user_data = {
            "name": user["name"],
            "email": user["email"],
            "domain": user["domain"],
            "role": user["role"],
            "aptitude_score": user.get("aptitude_score", 0),
            "technical_score": user.get("technical_score", 0),
            "total_score": user.get("total_score", 0),
            "test_completed": user.get("test_completed", False)
        }
        users.append(user_data)

    return {"users": users}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "MCQ Test Platform API",
        "docs": "/docs",
        "frontend": "Open index.html in your browser"
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)