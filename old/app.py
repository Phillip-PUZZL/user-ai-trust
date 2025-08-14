import json
import os
import sqlite3

from flask import Flask, request, jsonify
from flask_cors import CORS
import secrets
from chatgpt_api import get_chatgpt_dual_response, get_chatgpt_response
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)
app.secret_key = os.getenv("APP_SECRET_KEY")

valid_auth_keys = {}

ACCESS_PASSCODE = os.getenv("ACCESS_PASSCODE")

# Load JSON Data
def load_historical_figures():
    with open("../../historical_figures.json", "r", encoding="utf-8") as file:
        return json.load(file)

# API Route to Serve Historical Figures
@app.route("/historical-figures", methods=["GET"])
def get_historical_figures():
    figures = load_historical_figures()
    return jsonify(figures)


def get_user_by_id(user_id):
    conn = sqlite3.connect("ai_trust_research.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user_info WHERE id = ?", (user_id,))
    user_row = cursor.fetchone()

    conn.close()

    return user_row


@app.route("/authenticate", methods=["POST"])
def authenticate():
    """Validates passcode and issues an authentication key."""
    data = request.json
    if data.get("passcode") == ACCESS_PASSCODE:
        auth_key = secrets.token_hex(16)
        valid_auth_keys[auth_key] = True
        return jsonify({"auth_key": auth_key})
    return jsonify({"error": "Invalid passcode"}), 401


@app.route("/generate", methods=["POST"])
def generate_responses():
    """Handles requests to generate accurate and falsified responses."""
    data = request.json
    auth_key = data.get("auth_key")
    historical_figure = data.get("historical_figure")
    user_id = int(data.get("user_id"))

    user = get_user_by_id(user_id)

    if not auth_key or auth_key not in valid_auth_keys:
        return jsonify({"error": "Unauthorized"}), 403

    if not historical_figure:
        return jsonify({"error": "No historical figure provided"}), 400

    responses = get_chatgpt_dual_response(historical_figure, user[1], user[2])
    return jsonify({"responses": responses})


def store_prompt_engineering(user_id, instructions, prompt, response):
    conn = sqlite3.connect("ai_trust_research.db")
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO prompt_engineering (user_id, instructions, prompt, response)
        VALUES (?, ?, ?, ?)
    """, (user_id, instructions, prompt, response))
    conn.commit()
    conn.close()


@app.route("/generate-new", methods=["POST"])
def generate_responses_new():
    """Handles requests to generate user specified responses."""
    data = request.json
    auth_key = data.get("auth_key")
    user_id = data.get("user_id")
    instructions = data.get("instructions")
    prompt = data.get("prompt")

    if not auth_key or auth_key not in valid_auth_keys:
        return jsonify({"error": "Unauthorized"}), 403

    if not instructions:
        return jsonify({"error": "No instructions provided"}), 400
    elif not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    responses = get_chatgpt_response(instructions, prompt)
    store_prompt_engineering(user_id, instructions, prompt, responses)
    return jsonify({"responses": responses})


# Function to insert response into database
def store_response(user_id, historical_figure, accurate, inaccurate, correction, presented_to_user, user_response, is_correct):
    conn = sqlite3.connect("ai_trust_research.db")
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO responses (user_id, historical_figure, accurate, inaccurate, correction, presented_to_user, user_response, is_correct)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, historical_figure, accurate, inaccurate, correction, presented_to_user, user_response, is_correct))
    conn.commit()
    conn.close()

# Route to store user response
@app.route("/store-response", methods=["POST"])
def store_user_response():
    data = request.json

    user_id = data.get("user_id")
    historical_figure = data.get("historical_figure")
    accurate = json.dumps(data.get("accurate"))
    inaccurate = json.dumps(data.get("inaccurate"))
    correction = data.get("correction")
    presented_to_user = data.get("presented_to_user")
    user_response = data.get("user_response")
    is_correct = data.get("is_correct")
    auth_key = data.get("auth_key")

    if not auth_key or auth_key not in valid_auth_keys:
        return jsonify({"error": "Unauthorized"}), 403

    if not all([user_id, historical_figure, accurate, inaccurate, correction, presented_to_user, user_response, is_correct is not None]):
        return jsonify({"error": "Missing required fields"}), 400

    store_response(user_id, historical_figure, accurate, inaccurate, correction, presented_to_user, user_response, is_correct)
    return jsonify({"message": "Response stored successfully!"})


def store_user(age, grade, sex):
    conn = sqlite3.connect("ai_trust_research.db")
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO user_info (age, grade, sex)
        VALUES (?, ?, ?)
    """, (age, grade, sex))
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()

    return user_id


# Route to store user info
@app.route("/store-user-info", methods=["POST"])
def store_user_info():
    data = request.json

    age = data.get("age")
    grade = data.get("grade")
    sex = data.get("sex")
    auth_key = data.get("auth_key")

    if not auth_key or auth_key not in valid_auth_keys:
        return jsonify({"error": "Unauthorized"}), 403

    if not all([age, grade, sex is not None]):
        return jsonify({"error": "Missing required fields"}), 400

    user_id = store_user(age, grade, sex)
    return jsonify({"message": "User info stored successfully!", "user_id": user_id})


# Function to insert pre survey info into database
def store_pre(user_id, q1, q2, q3, q4, q5, q6):
    conn = sqlite3.connect("ai_trust_research.db")
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO pre_survey (user_id, question_1, question_2, question_3, question_4, question_5, question_6)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (user_id, q1, q2, q3, q4, q5, q6))
    conn.commit()
    conn.close()


# Route to store pre survey answers
@app.route("/store-pre-survey", methods=["POST"])
def store_pre_survey():
    data = request.json

    user_id = data.get("user_id")
    question_1 = int(data.get("question_1"))
    question_2 = int(data.get("question_2"))
    question_3 = int(data.get("question_3"))
    question_4 = int(data.get("question_4"))
    question_5 = int(data.get("question_5"))
    question_6 = int(data.get("question_6"))
    auth_key = data.get("auth_key")

    if not auth_key or auth_key not in valid_auth_keys:
        return jsonify({"error": "Unauthorized"}), 403

    if not all([user_id, question_1, question_2, question_3, question_4, question_5, question_6 is not None]):
        return jsonify({"error": "Missing required fields"}), 400

    store_pre(user_id, question_1, question_2, question_3, question_4, question_5, question_6)
    return jsonify({"message": "Response stored successfully!"})


def store_post(user_id, q1, q2, q3, q4, q5, q6):
    conn = sqlite3.connect("ai_trust_research.db")
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO post_survey (user_id, question_1, question_2, question_3, question_4, question_5, question_6)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (user_id, q1, q2, q3, q4, q5, q6))
    conn.commit()
    conn.close()


# Route to store post survey answers
@app.route("/store-post-survey", methods=["POST"])
def store_post_survey():
    data = request.json

    user_id = data.get("user_id")
    question_1 = int(data.get("question_1"))
    question_2 = int(data.get("question_2"))
    question_3 = int(data.get("question_3"))
    question_4 = int(data.get("question_4"))
    question_5 = data.get("question_5")
    question_6 = data.get("question_6")
    auth_key = data.get("auth_key")

    if not auth_key or auth_key not in valid_auth_keys:
        return jsonify({"error": "Unauthorized"}), 403

    if not all([user_id, question_1, question_2, question_3, question_4, question_5, question_6 is not None]):
        return jsonify({"error": "Missing required fields"}), 400

    store_post(user_id, question_1, question_2, question_3, question_4, question_5, question_6)
    return jsonify({"message": "Response stored successfully!"})


if __name__ == "__main__":
    app.run(debug=False)