"""
Sample Data Seeder for MCQ Platform
Run this script to populate your database with sample questions
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# MongoDB Configuration
MONGO_URL = "mongodb+srv://mohankalimuthu2004_db_user:2IyrWggMKRoOtLFb@habitiqrag.jplmfdn.mongodb.net/?appName=HabitIQRag"
DATABASE_NAME = "Nexto"

# Sample Aptitude Questions
APTITUDE_QUESTIONS = [
    {
        "question": "If a train travels 120 km in 2 hours, what is its average speed?",
        "options": ["40 km/h", "50 km/h", "60 km/h", "70 km/h"],
        "answer": 2,
        "type": "aptitude"
    },
    {
        "question": "What is 15% of 200?",
        "options": ["20", "25", "30", "35"],
        "answer": 2,
        "type": "aptitude"
    },
    {
        "question": "If 5 workers can complete a job in 12 days, how many days will 3 workers take?",
        "options": ["15 days", "18 days", "20 days", "24 days"],
        "answer": 2,
        "type": "aptitude"
    },
    {
        "question": "What is the next number in the sequence: 2, 6, 12, 20, ?",
        "options": ["28", "30", "32", "34"],
        "answer": 1,
        "type": "aptitude"
    },
    {
        "question": "A shirt is marked 40% off. If the original price was $80, what is the sale price?",
        "options": ["$32", "$40", "$48", "$52"],
        "answer": 2,
        "type": "aptitude"
    },
    {
        "question": "If A = 1, B = 2, C = 3... what is the sum of letters in 'CAB'?",
        "options": ["5", "6", "7", "8"],
        "answer": 1,
        "type": "aptitude"
    },
    {
        "question": "In a class of 40 students, 60% are boys. How many girls are there?",
        "options": ["12", "14", "16", "18"],
        "answer": 2,
        "type": "aptitude"
    },
    {
        "question": "What is the area of a rectangle with length 15 cm and width 8 cm?",
        "options": ["100 cm²", "110 cm²", "120 cm²", "130 cm²"],
        "answer": 2,
        "type": "aptitude"
    },
    {
        "question": "If today is Wednesday, what day will it be 100 days from now?",
        "options": ["Monday", "Tuesday", "Wednesday", "Thursday"],
        "answer": 3,
        "type": "aptitude"
    },
    {
        "question": "A car uses 8 liters of fuel to travel 100 km. How much fuel is needed for 350 km?",
        "options": ["24 liters", "26 liters", "28 liters", "30 liters"],
        "answer": 2,
        "type": "aptitude"
    }
]

# Sample Technical Questions (General Programming/CS)
TECHNICAL_QUESTIONS = [
    {
        "question": "What does HTML stand for?",
        "options": [
            "Hyper Text Markup Language",
            "High Tech Modern Language",
            "Home Tool Markup Language",
            "Hyperlinks and Text Markup Language"
        ],
        "answer": 0,
        "type": "technical"
    },
    {
        "question": "Which data structure uses LIFO (Last In First Out) principle?",
        "options": ["Queue", "Stack", "Array", "Linked List"],
        "answer": 1,
        "type": "technical"
    },
    {
        "question": "What is the time complexity of binary search algorithm?",
        "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"],
        "answer": 1,
        "type": "technical"
    },
    {
        "question": "Which programming language is known as the 'mother of all languages'?",
        "options": ["C", "Assembly", "COBOL", "Fortran"],
        "answer": 0,
        "type": "technical"
    },
    {
        "question": "What does SQL stand for?",
        "options": [
            "Structured Question Language",
            "Structured Query Language",
            "Simple Query Language",
            "Standard Query Language"
        ],
        "answer": 1,
        "type": "technical"
    },
    {
        "question": "Which HTTP method is used to update a resource?",
        "options": ["GET", "POST", "PUT", "DELETE"],
        "answer": 2,
        "type": "technical"
    },
    {
        "question": "What is the output of: print(type([]))?",
        "options": ["<class 'list'>", "<class 'array'>", "<class 'tuple'>", "<class 'dict'>"],
        "answer": 0,
        "type": "technical"
    },
    {
        "question": "In OOP, what is the concept of hiding internal details called?",
        "options": ["Inheritance", "Polymorphism", "Encapsulation", "Abstraction"],
        "answer": 2,
        "type": "technical"
    },
    {
        "question": "Which CSS property is used to change text color?",
        "options": ["text-color", "font-color", "color", "text-style"],
        "answer": 2,
        "type": "technical"
    },
    {
        "question": "What is the default port number for HTTP?",
        "options": ["8080", "443", "80", "3000"],
        "answer": 2,
        "type": "technical"
    },
    {
        "question": "Which symbol is used for comments in Python?",
        "options": ["//", "/* */", "#", "<!--"],
        "answer": 2,
        "type": "technical"
    },
    {
        "question": "What does API stand for?",
        "options": [
            "Application Programming Interface",
            "Advanced Programming Interface",
            "Application Process Interface",
            "Automated Programming Interface"
        ],
        "answer": 0,
        "type": "technical"
    },
    {
        "question": "Which database is NOT a relational database?",
        "options": ["MySQL", "PostgreSQL", "MongoDB", "Oracle"],
        "answer": 2,
        "type": "technical"
    },
    {
        "question": "What is the purpose of the 'git clone' command?",
        "options": [
            "Create a new repository",
            "Copy a repository from remote to local",
            "Delete a repository",
            "Merge branches"
        ],
        "answer": 1,
        "type": "technical"
    },
    {
        "question": "Which JavaScript method is used to add an element to the end of an array?",
        "options": ["add()", "append()", "push()", "insert()"],
        "answer": 2,
        "type": "technical"
    }
]


async def seed_database():
    """Seed the database with sample questions"""
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DATABASE_NAME]
        questions_collection = db.questions

        print("🔗 Connected to MongoDB")

        # Clear existing questions (optional - comment out if you want to keep existing)
        # await questions_collection.delete_many({})
        # print("🗑️  Cleared existing questions")

        # Insert Aptitude Questions
        aptitude_docs = []
        for q in APTITUDE_QUESTIONS:
            q["created_at"] = datetime.utcnow()
            aptitude_docs.append(q)

        if aptitude_docs:
            result = await questions_collection.insert_many(aptitude_docs)
            print(f"✅ Inserted {len(result.inserted_ids)} aptitude questions")

        # Insert Technical Questions
        technical_docs = []
        for q in TECHNICAL_QUESTIONS:
            q["created_at"] = datetime.utcnow()
            technical_docs.append(q)

        if technical_docs:
            result = await questions_collection.insert_many(technical_docs)
            print(f"✅ Inserted {len(result.inserted_ids)} technical questions")

        # Summary
        total_aptitude = await questions_collection.count_documents({"type": "aptitude"})
        total_technical = await questions_collection.count_documents({"type": "technical"})

        print("\n📊 Database Summary:")
        print(f"   Total Aptitude Questions: {total_aptitude}")
        print(f"   Total Technical Questions: {total_technical}")
        print(f"   Total Questions: {total_aptitude + total_technical}")
        print("\n✨ Database seeding completed successfully!")

        client.close()

    except Exception as e:
        print(f"❌ Error seeding database: {e}")


if __name__ == "__main__":
    print("🌱 Starting database seeding...\n")
    asyncio.run(seed_database())