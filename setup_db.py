import sqlite3

# Connect to SQLite database (creates it if it doesn't exist)
conn = sqlite3.connect("ai_trust_research.db")
cursor = conn.cursor()

# Create table if it doesn't exist
cursor.execute("""
    CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        historical_figure TEXT NOT NULL,
        accurate TEXT NOT NULL,
        inaccurate TEXT NOT NULL,
        correction TEXT NOT NULL,
        presented_to_user TEXT NOT NULL,
        user_response TEXT NOT NULL,
        is_correct BOOLEAN NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
""")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS pre_survey (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        question_1 INTEGER NOT NULL,
        question_2 INTEGER NOT NULL,
        question_3 INTEGER NOT NULL,
        question_4 INTEGER NOT NULL,
        question_5 INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
""")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS post_survey (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        question_1 INTEGER NOT NULL,
        question_2 INTEGER NOT NULL,
        question_3 INTEGER NOT NULL,
        question_4 TEXT NOT NULL,
        question_5 TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
""")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        age INTEGER NOT NULL,
        grade INTEGER NOT NULL,
        sex TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
""")

# Commit and close connection
conn.commit()
conn.close()

print("Database setup complete!")
