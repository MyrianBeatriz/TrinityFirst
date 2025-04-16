# Author: Myri B. Ayala
# Flask API that provides endpoints for mentorship program application. It uses Google's Gemini 1.5 Pro for AI generated content and matching
# Last updated: March 26th, 2025

import os
import firebase_admin
from firebase_admin import credentials, firestore
import google.generativeai as genai
from flask import Flask, request, jsonify
import json
import re
import tempfile
import datetime
from werkzeug.utils import secure_filename
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# importing modules need for file processing
try:
    import PyPDF2
    import docx
    PDF_DOCX_AVAILABLE = True
except ImportError:
    PDF_DOCX_AVAILABLE = False
    print("Warning: PyPDF2 or python-docx not available. Text extraction will be limited.")

# Get API keys and sensitive data from environment variables
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY environment variable is not set")
    print("Running in mock mode without AI capabilities")
    USE_AI = False
else:
    USE_AI = True

# Get Firebase credentials path from environment variable with fallback
FIREBASE_CREDENTIALS_PATH = os.environ.get(
    "FIREBASE_CREDENTIALS_PATH", 
    os.path.join(os.path.dirname(__file__), "trinity-first-13999-firebase-adminsdk-qrrx7-e8145d3afb.json")
)

# Make sure the credentials file exists, otherwise use mock mode
if not os.path.exists(FIREBASE_CREDENTIALS_PATH):
    print(f"WARNING: Firebase credentials file not found at: {FIREBASE_CREDENTIALS_PATH}")
    print("Running in mock mode without Firebase.")
    USE_FIREBASE = False
else:
    USE_FIREBASE = True

# Initialize Firebase Admin SDK if credentials are available
if USE_FIREBASE:
    try:
        cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Successfully initialized Firebase")
    except Exception as e:
        print(f"Error initializing Firebase: {str(e)}")
        USE_FIREBASE = False
        db = None
else:
    db = None

app = Flask(__name__)
# Get allowed origins from environment variable with fallback for development
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
allowed_origins_list = [origin.strip() for origin in allowed_origins.split(",")]
CORS(app, origins=allowed_origins_list)  # Only allow specific origins

# Configure Gemini API if API key is available
if USE_AI:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # Use a single model throughout the application
        GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-1.5-pro-latest")
        print(f"Successfully configured Gemini API with model: {GEMINI_MODEL}")
    except Exception as e:
        print(f"Error configuring Gemini API: {str(e)}")
        USE_AI = False
else:
    GEMINI_MODEL = None

# Create uploads directory if it doesn't exist
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Mock content generator for when AI is not available
def get_mock_role_specific_content(role):
    """Generate mock content for mentorship forms when AI is not available"""
    timestamp = datetime.datetime.now().isoformat()
    print(f"Generating mock content for role: {role} at {timestamp}")
    
    if role == "Mentor":
        return {
            "academicInterests": "I am interested in computer science, particularly in artificial intelligence and software engineering. I plan to continue my education in graduate school focusing on machine learning.",
            "extracurriculars": "I participate in coding club, volunteer at local STEM events, and am part of the university's tech innovation group.",
            "mentorMotivation": "I want to help other students navigate the challenges I faced when I first started college. Being a first-generation student myself, I understand the unique obstacles.",
            "firstGenChallenges": "The biggest challenges I faced were understanding financial aid systems, navigating academic requirements, and building a professional network from scratch.",
            "mentorStrengths": "I'm patient, good at explaining complex concepts in simple terms, and I have experience with academic planning and career development.",
            "communicationStyle": "I prefer regular check-ins and direct communication. I believe in asking clarifying questions and providing constructive feedback.",
            "desiredSupport": "I wish I had someone to help me understand the unwritten rules of college and professional environments, as well as guidance on internship opportunities.",
            "additionalInfo": "I've been through many of the same challenges and am committed to helping others succeed where I struggled.",
            "expectations": "I expect to meet regularly with my mentee, help them set and achieve goals, and be available for questions and guidance.",
            "source": "mock_data",
            "timestamp": timestamp
        }
    else:  # Mentee
        return {
            "careerGoals": "I'm interested in pursuing a career in technology, possibly as a software developer or data analyst. I'm still exploring options but want to work in an innovative field.",
            "experienceSummary": "I'm currently a freshman studying computer science. I have basic programming knowledge from high school and am eager to gain more practical experience.",
            "challenges": "As a first-generation college student, I struggle with navigating the college system, understanding career paths, and building professional connections.",
            "expectations": "I hope to gain guidance on course selection, internship opportunities, and general advice on succeeding in the tech field.",
            "additionalInfo": "I'm particularly interested in learning about the transition from college to industry and what skills I should focus on developing.",
            "source": "mock_data",
            "timestamp": timestamp
        }

# Centralized error handling and logging utility
def handle_error(error, error_type="server_error", status_code=500, log_level="error", role=None):
    """
    Centralized error handling with consistent response format and logging
    
    Args:
        error: The exception or error message
        error_type: Category of error for client-side handling
        status_code: HTTP status code to return
        log_level: Severity level for logging (error, warning, info)
        role: Optional role for mentorship-specific errors
        
    Returns:
        Tuple of (response_json, status_code)
    """
    error_msg = str(error)
    timestamp = datetime.datetime.now().isoformat()
    
    # Log the error with appropriate level
    if log_level == "error":
        print(f"ERROR [{timestamp}] {error_type}: {error_msg}")
    elif log_level == "warning":
        print(f"WARNING [{timestamp}] {error_type}: {error_msg}")
    else:
        print(f"INFO [{timestamp}] {error_type}: {error_msg}")
    
    # Basic error response
    response = {
        "success": False,
        "error": True,
        "errorType": error_type,
        "errorMessage": error_msg,
        "timestamp": timestamp
    }
    
    # For mentorship form errors, include empty fields
    if role:
        # Fields based on role
        if role == "Mentor":
            fields = [
                "academicInterests", "extracurriculars", "mentorMotivation",
                "firstGenChallenges", "mentorStrengths", "communicationStyle",
                "desiredSupport", "additionalInfo", "expectations"
            ]
        else:  # Mentee
            fields = ["careerGoals", "experienceSummary", "challenges", "expectations", "additionalInfo"]
        
        # Add empty fields to response
        for field in fields:
            response[field] = ""
    
    return jsonify(response), status_code

#Returns error if it doesn't work
def get_error_response(role, error_source="unknown"):
    """Legacy function for backward compatibility"""
    response_json, _ = handle_error(
        error="Could not generate content. Please try again or enter answers manually.",
        error_type=error_source,
        status_code=200,  # Keep original behavior
        role=role
    )
    return response_json.json  # Extract the dictionary from the response

@app.route("/process-file", methods=["POST"])
#Process uploaded file directly
def process_file():
    print("Received file upload request")

    if 'file' not in request.files:
        print("No file part in the request")
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    user_id = request.form.get('userId', 'anonymous')
    role = request.form.get('role', 'Mentee')  # Default to mentee if not specified

    if file.filename == '':
        print("No file selected")
        return jsonify({"error": "No file selected"}), 400
        
    # Validate file type and size
    allowed_extensions = {'pdf', 'docx', 'doc'}
    max_file_size = 5 * 1024 * 1024  # 5MB
    
    # Check file extension
    file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    if file_ext not in allowed_extensions:
        print(f"Invalid file type: {file_ext}")
        return jsonify({"error": f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}"}), 400
    
    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)  # Reset file pointer
    
    if file_size > max_file_size:
        print(f"File too large: {file_size} bytes")
        return jsonify({"error": f"File too large. Maximum size: 5MB"}), 400

    print(f"Processing file: {file.filename} for user: {user_id}, role: {role}") #see in terminal

    try:
        # Validate user ID format if provided
        if user_id != 'anonymous' and not re.match(r'^[a-zA-Z0-9_-]+$', user_id):
            return jsonify({"error": "Invalid user ID format"}), 400
        
        # Save the file to a temporary location with secure path handling
        filename = secure_filename(file.filename)
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, filename)
        
        # Verify path is inside temp directory (prevent path traversal)
        abs_temp_dir = os.path.abspath(temp_dir)
        abs_temp_path = os.path.abspath(temp_path)
        if not abs_temp_path.startswith(abs_temp_dir):
            return jsonify({"error": "Invalid file path"}), 400
            
        file.save(temp_path)

        # Extract text based on file type
        extracted_text = ""
        file_extension = os.path.splitext(filename)[1].lower()

        if file_extension == '.pdf' and PDF_DOCX_AVAILABLE:
            print("Processing PDF file")
            pdf_reader = PyPDF2.PdfReader(temp_path)
            for page in pdf_reader.pages:
                extracted_text += page.extract_text() + "\n"

        elif (file_extension == '.docx' or file_extension == '.doc') and PDF_DOCX_AVAILABLE:
            print("Processing Word document")
            doc = docx.Document(temp_path)
            for para in doc.paragraphs:
                extracted_text += para.text + "\n"
        else:
            print(f"Unsupported file format: {file_extension}")
            os.remove(temp_path)  # Clean up temporary file
            return jsonify(get_error_response(role, "unsupported_file_format"))

        # Clean up temporary file
        os.remove(temp_path)

        print(f"Extracted text length: {len(extracted_text)}")

        if len(extracted_text) < 50:
            print(f"Warning: Very little text extracted: {extracted_text}")
            return jsonify(get_error_response(role, "insufficient_text"))

        # Generate content based on the extracted text
        result = generate_role_specific_content(extracted_text, role)
        
        # Add debug info
        result["source"] = "file_processing"
        result["timestamp"] = str(datetime.datetime.now())
        
        return jsonify(result)

    except Exception as e:
        print(f"Error processing file: {str(e)}")
        return jsonify(get_error_response(role, "file_processing_error"))

@app.route("/save-resume", methods=["POST"])
#Save resume file to server storage 
def save_resume():
    if 'file' not in request.files:
        return jsonify({"error": "No file"}), 400

    file = request.files['file']
    user_id = request.form.get('userId', 'anonymous')

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    # Validate user ID format
    if not re.match(r'^[a-zA-Z0-9_-]+$', user_id):
        return jsonify({"error": "Invalid user ID format"}), 400
    
    # Validate file type and size
    allowed_extensions = {'pdf', 'docx', 'doc'}
    max_file_size = 5 * 1024 * 1024  # 5MB
    
    # Check file extension
    file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    if file_ext not in allowed_extensions:
        print(f"Invalid file type: {file_ext}")
        return jsonify({"error": f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}"}), 400
    
    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)  # Reset file pointer
    
    if file_size > max_file_size:
        print(f"File too large: {file_size} bytes")
        return jsonify({"error": f"File too large. Maximum size: 5MB"}), 400

    try:
        # Prevent path traversal by validating and sanitizing the user_id
        sanitized_user_id = secure_filename(user_id)
        if sanitized_user_id != user_id:
            return jsonify({"error": "Invalid user ID"}), 400
            
        # Create user directory if it doesn't exist
        user_dir = os.path.join(UPLOAD_FOLDER, sanitized_user_id)
        # Use absolute path to avoid path traversal
        absolute_upload_folder = os.path.abspath(UPLOAD_FOLDER)
        absolute_user_dir = os.path.abspath(user_dir)
        
        # Ensure the directory is inside the uploads folder
        if not absolute_user_dir.startswith(absolute_upload_folder):
            return jsonify({"error": "Invalid user directory path"}), 400
            
        if not os.path.exists(absolute_user_dir):
            os.makedirs(absolute_user_dir)

        # Save the file
        filename = secure_filename(file.filename)
        file_path = os.path.join(absolute_user_dir, filename)
        file.save(file_path)

        # Add record to Firestore if available
        if USE_FIREBASE and db:
            try:
                db.collection("user_files").document(user_id).set({
                    "resumePath": file_path,
                    "originalFilename": file.filename,
                    "timestamp": firestore.SERVER_TIMESTAMP
                }, merge=True)
                print(f"Added file record to Firestore for user: {user_id}")
            except Exception as e:
                print(f"Error adding to Firestore: {str(e)}")
                # Continue anyway since the file was successfully saved
        else:
            print("Firebase not available, skipping database record")

        return jsonify({"message": "File saved successfully", "path": file_path})
    except Exception as e:
        print(f"Error saving file: {str(e)}")
        return jsonify({"error": str(e)}), 500

#Generate content based on the user's role with guaranteed field coverage
def generate_role_specific_content(text_content, role):
   
    try:
        # Create prompt based on role with explicit field requirements
        if role == "Mentor":
            prompt = f"""
            
            Based on the following resume or profile information, generate thoughtful responses for a mentorship application where the user is applying to be a MENTOR. Write responses in first person, as if the user is describing themselves:

            {text_content}

            For each of the following categories, you MUST provide a paragraph (3-5 sentences) response. Each field is required and must have content:

            1. Academic Interests: What are your academic interests and career goals?
            2. Extracurricular Activities: What extracurricular activities, clubs, or organizations are you involved in?
            3. Mentor Motivation: Why do you want to be a mentor in this program?
            4. First-Gen Challenges: What challenges did you face as a first-generation student that you want to help others navigate?
            5. Mentor Strengths: What strengths do you bring as a mentor?
            6. Communication Style: How would you describe your communication and leadership style?
            7. Desired Support: What kind of support do you wish you had when you started college?
            8. Additional Info: Is there anything else you'd like us to know about your mentorship goals or expectations?
            9. Expectations: What are your expectations from this mentorship experience as a mentor?

            Format your response as a valid JSON object with exactly these keys: 
            academicInterests, extracurriculars, mentorMotivation, firstGenChallenges, mentorStrengths, communicationStyle, desiredSupport, additionalInfo, expectations

            Make sure ALL fields are included and have content, even if you have to creatively interpret the resume.
            """
        else:  # Mentee
            prompt = f"""
            Based on the following resume or profile information, generate thoughtful responses for a mentorship application where the user is applying to be a MENTEE. Write responses in first person, as if the user is describing themselves:

            {text_content}

            For each of the following categories, you MUST provide a paragraph (3-5 sentences) response. Each field is required and must have content:

            1. Career Goals: What are your short-term and long-term career aspirations?
            2. Experience Summary: Describe your academic and professional experience so far.
            3. Challenges: What challenges have you faced in your academic or career journey?
            4. Expectations: What are your expectations from this mentorship?
            5. Additional Info: Is there anything else you'd like us to know about your mentorship goals or expectations?

            Format your response as a valid JSON object with exactly these keys: 
            careerGoals, experienceSummary, challenges, expectations, additionalInfo

            Make sure ALL fields are included and have content, even if you have to creatively interpret the resume.
            """

        print("Sending prompt to Gemini API")

        # Use Gemini 1.5 Pro if available
        if not USE_AI:
            print("AI is not available, returning mock response")
            return get_mock_role_specific_content(role)
            
        try:
            print(f"Generating content with {GEMINI_MODEL}")
            # Check if API key is set and has at least some content
            if not GEMINI_API_KEY or len(GEMINI_API_KEY) < 10:
                print("WARNING: API key is missing or too short, likely invalid")
                return get_mock_role_specific_content(role)
            
            response = genai.GenerativeModel(GEMINI_MODEL).generate_content(prompt)
            print("Successfully generated content")
        except Exception as e:
            print(f"Error with model {GEMINI_MODEL}: {str(e)}")
            print("Using mock response")
            return get_mock_role_specific_content(role)

        if not response:
            print("No response object was created, returning error response")
            return get_error_response(role, "empty_response")

        print(f"Raw response first 100 chars: {response.text[:100]}...")

        # Define expected fields based on role
        if role == "Mentor":
            expected_fields = [
                "academicInterests", "extracurriculars", "mentorMotivation",
                "firstGenChallenges", "mentorStrengths", "communicationStyle",
                "desiredSupport", "additionalInfo", "expectations"
            ]
        else:  # Mentee
            expected_fields = ["careerGoals", "experienceSummary", "challenges", "expectations", "additionalInfo"]

        # Try multiple approaches to extract content
        result = {}
        
        # Approach 1: Direct JSON parsing
        try:
            content_json = json.loads(response.text)
            result = content_json
            print("Successfully parsed response as JSON")
        except json.JSONDecodeError:
            # Approach 2: Find JSON in text
            json_pattern = r'({[\s\S]*})'
            json_matches = re.findall(json_pattern, response.text)
            
            for potential_json in json_matches:
                try:
                    content_json = json.loads(potential_json)
                    result = content_json
                    print("Successfully extracted JSON from text")
                    break
                except json.JSONDecodeError:
                    continue
                            
        # Ensure all expected fields are present (empty if missing)
        for field in expected_fields:
            if field not in result:
                print(f"Field {field} missing, setting empty string")
                result[field] = ""
        
        # Add meta information
        result["source"] = "ai_generated"
        result["parsedFrom"] = "Resume/Document"
        
        return result

    except Exception as e:
        print(f"Error generating content: {str(e)}")
        import traceback
        traceback.print_exc()  # Print stack trace for debugging
        return get_error_response(role, "content_generation_error")

@app.route("/match", methods=["POST"])
def match():
    """Process mentorship signup data"""
    try:
        data = request.json
        user_id = data.get("userId")

        print(f"Received signup for user {user_id}")

        # Check if user has already signed up (if Firebase is available)
        if user_id and USE_FIREBASE and db:
            try:
                existing_signup = db.collection("mentorship_signups").document(user_id).get()
                if existing_signup.exists:
                    print(f"User {user_id} has already signed up")
                    return jsonify({
                        "status": "error",
                        "message": "You have already signed up for the mentorship program.",
                        "timestamp": str(datetime.datetime.now())
                    }), 400
            except Exception as e:
                print(f"Error checking signup status: {str(e)}")
                # Continue anyway since it's just a check

        # Save data to Firestore if available
        if USE_FIREBASE and db:
            try:
                if user_id:
                    db.collection("mentorship_signups").document(user_id).set(data)
                    print(f"Saved signup data for user {user_id} to Firestore")
            except Exception as e:
                print(f"Error saving to Firestore: {str(e)}")
                # Continue anyway to avoid blocking user signup
        else:
            print("Firebase not available, skipping database storage")

        return jsonify({
            "matchResult": "Your application has been received successfully! We'll notify you when you've been matched with a mentor/mentee.",
            "status": "success",
            "timestamp": str(datetime.datetime.now())
        })
    except Exception as e:
        print(f"Error in match endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/check-signup-status", methods=["POST"])
def check_signup_status():
    """Check if user has already signed up for mentorship"""
    try:
        data = request.json
        user_id = data.get("userId")
        
        if not user_id:
            return jsonify({"error": "User ID is required"}), 400
            
        if not USE_FIREBASE or not db:
            # Without Firebase, just return a mock response
            return jsonify({
                "exists": False,
                "role": None,
                "mock": True
            })
            
        try:
            # Check if user has already signed up
            existing_signup = db.collection("mentorship_signups").document(user_id).get()
            
            # Check if user is already in a match
            mentee_matches = db.collection("mentorship_matches").where("menteeId", "==", user_id).get()
            mentor_matches = db.collection("mentorship_matches").where("mentorId", "==", user_id).get()
            
            has_match = len(list(mentee_matches)) > 0 or len(list(mentor_matches)) > 0
            
            return jsonify({
                "exists": existing_signup.exists or has_match,
                "role": existing_signup.to_dict().get("mentorshipRole") if existing_signup.exists else None
            })
        except Exception as e:
            print(f"Error checking signup status: {e}")
            return jsonify({
                "exists": False,
                "role": None,
                "error": str(e)
            })
    except Exception as e:
        print(f"Error checking signup status: {e}")
        return jsonify({"error": str(e)}), 500
        
@app.route("/debug/get-error-response", methods=["GET"])
def get_error_response_endpoint():
    """Return error response for testing with role parameter"""
    role = request.args.get("role", "Mentee")
    
    print(f"Generating error response for role: {role}")
    
    # Get error response
    content = get_error_response(role, "debug_endpoint")
    
    # Add debug info to help troubleshoot
    content["source"] = "server_error"
    content["generatedFor"] = role
    
    print(f"Returning error response keys: {list(content.keys())}")
    
    return jsonify(content)

@app.route("/generate-matches", methods=["POST"])
def generate_matches():
    """AI-based mentorship matching using Gemini API"""
    try:
        print("Received request to generate matches")
        data = request.json
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        mentors = data.get('mentors', [])
        mentees = data.get('mentees', [])
        max_mentees_per_mentor = data.get('maxMenteesPerMentor', 3)  # Get setting from request
        
        if not mentors:
            return jsonify({"error": "No mentors provided"}), 400
        if not mentees:
            return jsonify({"error": "No mentees provided"}), 400
            
        print(f"Processing match request with {len(mentors)} mentors and {len(mentees)} mentees")
        print(f"Max mentees per mentor: {max_mentees_per_mentor}")
            
        # Create prompt for Gemini
        prompt = f"""
        You are an AI assistant helping match mentors with mentees in a college mentorship program at Trinity.
        Below are the details of available mentors and mentees. Please create optimal mentor-mentee pairs based on:
        1. Academic interests and major alignment
        2. Mentorship strengths matching mentee challenges
        3. Career goals and expertise alignment

        CONSTRAINTS:
        - Each mentee should be matched with exactly one mentor
        - A mentor can have up to {max_mentees_per_mentor} mentees
        - Assign higher compatibility scores (between 0-100) for better matches
        - Every mentee MUST be matched with someone

        Provide your response as a JSON array of matches with the following structure for each match:
        {{
            "menteeId": "[mentee id]",
            "mentorId": "[mentor id]",
            "reason": "[detailed explanation of why this is a good match]",
            "score": [compatibility score between 0-100]
        }}

        MENTORS:
        """

        # Add mentor details
        for mentor in mentors:
            prompt += f"""
            Mentor ID: {mentor.get('id')}
            Name: {mentor.get('name', 'Unnamed Mentor')}
            Major: {mentor.get('major', 'Not specified')}
            Academic Interests: {mentor.get('academicInterests', 'Not specified')}
            Mentor Strengths: {mentor.get('mentorStrengths', 'Not specified')}
            """

        prompt += "\nMENTEES:"

        # Add mentee details
        for mentee in mentees:
            prompt += f"""
            Mentee ID: {mentee.get('id')}
            Name: {mentee.get('name', 'Unnamed Mentee')}
            Major: {mentee.get('major', 'Not specified')}
            Career Goals: {mentee.get('careerGoals', 'Not specified')}
            Challenges: {mentee.get('challenges', 'Not specified')}
            Expectations: {mentee.get('expectations', 'Not specified')}
            """

        prompt += """
        Return ONLY a valid JSON array of matches, with NO additional text before or after the JSON.
        """

        print("Sending prompt to Gemini API")
        try:
            # Use Gemini 1.5 Pro
            print(f"Attempting to generate matches with model: {GEMINI_MODEL}")
            response = genai.GenerativeModel(GEMINI_MODEL).generate_content(prompt)
            print(f"Successfully generated matches with {GEMINI_MODEL}")
        except Exception as e:
            print(f"Error with {GEMINI_MODEL}: {str(e)}")
            return generate_mock_matches(mentors, mentees)

        # Parse the response text
        print("Parsing AI response")
        response_text = response.text.strip()
        
        # Extract JSON from the response if needed
        if "```json" in response_text:
            # Extract JSON from code block
            json_text = response_text.split("```json")[1].split("```")[0].strip()
            print("Extracted JSON from code block")
        elif "```" in response_text:
            # Extract from generic code block
            json_text = response_text.split("```")[1].strip()
            print("Extracted from generic code block")
        else:
            # Use response text directly
            json_text = response_text
            print("Using response text directly")
            
        try:
            matches = json.loads(json_text)
            
            # Validate the matches
            if not isinstance(matches, list):
                print("Error: Response is not a list")
                return generate_mock_matches(mentors, mentees)
                
            for match in matches:
                if not (("menteeId" in match and "mentorId" in match) or 
                        ("mentee" in match and "mentor" in match)):
                    print("Error: Missing required fields in match")
                    return generate_mock_matches(mentors, mentees)
                
                # Standardize field names
                if "mentee" in match and "menteeId" not in match:
                    match["menteeId"] = match["mentee"]
                if "mentor" in match and "mentorId" not in match:
                    match["mentorId"] = match["mentor"]
                if "matchReason" in match and "reason" not in match:
                    match["reason"] = match["matchReason"]
                elif "reason" in match and "matchReason" not in match:
                    match["matchReason"] = match["reason"]
                if "compatibilityScore" in match and "score" not in match:
                    match["score"] = match["compatibilityScore"]
                elif "score" in match and "compatibilityScore" not in match:
                    match["compatibilityScore"] = match["score"]
                    
            print(f"Successfully generated {len(matches)} matches")
            
            # Save matches to Firestore if data wasn't provided directly and Firebase is available
            if (not data or ('saveToFirestore' in data and data['saveToFirestore'])) and USE_FIREBASE and db:
                try:
                    print("Saving matches to Firestore")
                    for match in matches:
                        db.collection("mentorship_matches").add({
                            "menteeId": match.get("menteeId"),
                            "mentorId": match.get("mentorId"),
                            "matchReason": match.get("reason", "AI-generated match"),
                            "compatibilityScore": match.get("score", 80),
                            "status": "pending",
                            "createdAt": datetime.datetime.now().isoformat(),
                            "aiGenerated": True
                        })
                    print("Matches saved to Firestore")
                except Exception as e:
                    print(f"Error saving matches to Firestore: {str(e)}")
                    # Continue anyway since we'll return the matches to the client
            elif not USE_FIREBASE or not db:
                print("Firebase not available, skipping database storage")
            
            # Return the matches
            return jsonify({
                "message": f"Successfully generated {len(matches)} matches",
                "matches": matches
            })
                
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {str(e)}")
            # Return mock data as fallback
            return generate_mock_matches(mentors, mentees)
            
    except Exception as e:
        print(f"Error in generate_matches: {str(e)}")
        return jsonify({"error": str(e)}), 500
        
def generate_mock_matches(mentors, mentees):
    """Generate mock matches when AI generation fails"""
    print("Generating mock matches")
    matches = []
    
    # Distribute mentees across mentors
    mentor_index = 0
    for i, mentee in enumerate(mentees):
        mentor = mentors[mentor_index]
        
        # Create compatibility score (70-95 range)
        score = 70 + (i % 25)
        
        # Get IDs, ensuring they exist
        mentee_id = mentee.get("id", f"mentee-{i}")
        mentor_id = mentor.get("id", f"mentor-{mentor_index}")
        
        matches.append({
            "menteeId": mentee_id,
            "mentorId": mentor_id,
            "reason": f"Match based on compatible academic interests and mentorship expectations.",
            "score": score
        })
        
        # Move to next mentor, loop back if needed
        mentor_index = (mentor_index + 1) % len(mentors)
    
    print(f"Generated {len(matches)} mock matches")
    
    # Save mock matches to Firestore
    try:
        print("Saving mock matches to Firestore")
        for match in matches:
            db.collection("mentorship_matches").add({
                "menteeId": match["menteeId"],
                "mentorId": match["mentorId"],
                "matchReason": match["reason"],
                "compatibilityScore": match["score"],
                "status": "pending",
                "createdAt": datetime.datetime.now().isoformat(),
                "aiGenerated": True,
                "isMockData": True
            })
        print("Mock matches saved to Firestore")
    except Exception as e:
        print(f"Error saving mock matches to Firestore: {str(e)}")
    
    return jsonify({
        "message": "Generated mock matches (AI matching failed)",
        "matches": matches
    })

@app.route("/delete-match", methods=["POST"])
def delete_match():
    """Delete a rejected match from the database"""
    try:
        data = request.json
        match_id = data.get("matchId")
        
        if not match_id:
            return jsonify({"error": "No match ID provided"}), 400
        
        # Delete the match from Firestore if available
        if not USE_FIREBASE or not db:
            return jsonify({
                "status": "success",
                "message": "Match successfully deleted (mock mode - no database)",
                "timestamp": str(datetime.datetime.now())
            })
            
        try:
            # Delete the match from Firestore
            db.collection("mentorship_matches").document(match_id).delete()
        except Exception as e:
            print(f"Error deleting match: {str(e)}")
            return jsonify({
                "status": "error",
                "message": f"Error deleting match: {str(e)}",
                "timestamp": str(datetime.datetime.now())
            }), 500
        
        return jsonify({
            "status": "success",
            "message": "Match successfully deleted",
            "timestamp": str(datetime.datetime.now())
        })
    except Exception as e:
        print(f"Error deleting match: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "service": "Mentorship API",
        "timestamp": datetime.datetime.now().isoformat(),
        "firebase_available": USE_FIREBASE,
        "ai_available": USE_AI,
        "pdf_processing_available": PDF_DOCX_AVAILABLE
    })

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)