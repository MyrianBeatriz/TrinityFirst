import os
import firebase_admin
from firebase_admin import credentials, firestore
import google.generativeai as genai
from flask import Flask, request, jsonify
import json
import re
from flask_cors import CORS

# 🔹 Initialize Firebase Admin SDK
cred = credentials.Certificate(os.path.join(os.path.dirname(__file__), "trinity-first-13999-firebase-adminsdk-qrrx7-e8145d3afb.json"))
firebase_admin.initialize_app(cred)

db = firestore.client()
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# 🔹 Configure Gemini API
genai.configure(api_key="AIzaSyArLGAl7XPV2loAOObSbv7GGCT9pST88dM")

@app.route("/generate-matches", methods=["POST"])
def generate_matches():
    try:
        signups_ref = db.collection("mentorship_signups").stream()
        users = [doc.to_dict() for doc in signups_ref]

        if not users:
            print("❌ No registered users found in Firestore.")
            return jsonify({"message": "No registered users found."}), 400

        # 🔍 Debugging: Print Users Before AI Processing
        print("✅ Retrieved Users from Firestore:", users)

        prompt = f"""
        Match mentors and mentees from this list: {users}.
        Provide responses in this format:
        "Mentee: [Mentee Name] | Mentor: [Mentor Name] | Compatibility Score: [Score] | Reason: [Why this is a good match]"

        - The Compatibility Score should be a **whole number (1-10)**, **not percentages or fractions**.
        - Return **ONLY** the matching details in this format, with no additional explanations or headers.
        """

        response = genai.GenerativeModel("gemini-pro").generate_content(prompt)
        match_result = response.text  # AI Response

        # 🔍 Debugging: Print AI Match Response
        print("✅ AI Response:", match_result)

        match_ref = db.collection("mentorship_matches")

        # 🔹 Parse AI-generated matches
        for line in match_result.split("\n"):
            if "Mentee:" in line and "Mentor:" in line:
                try:
                    parts = line.split("|")
                    mentee_name = parts[0].split(":")[1].strip()
                    mentor_name = parts[1].split(":")[1].strip()
                    score_str = parts[2].split(":")[1].strip()
                    reason = parts[3].split(":")[1].strip()

                    # Extract only numbers from the score string (fixes "8/10", "40%", etc.)
                    score_numbers = re.findall(r"\d+", score_str)
                    score = float(score_numbers[0]) if score_numbers else 0.0  # Use first found number

                    # Save match to Firestore
                    match_ref.document(mentee_name).set({
                        "mentee": mentee_name,
                        "mentor": mentor_name if mentor_name != "No Match Found" else None,
                        "compatibilityScore": score,
                        "matchReason": reason,
                        "adminOverride": None
                    })
                    print(f"✅ Saved match: {mentee_name} with {mentor_name} (Score: {score})")

                except Exception as e:
                    print(f"❌ Error parsing AI response: {e}")

        return jsonify({"message": "Matches generated successfully!"})

    except Exception as e:
        print(f"❌ Error generating matches: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)

