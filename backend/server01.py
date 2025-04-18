# Author: Myri B. Ayala
# Flask API that provides endpoints for mentorship program application. It uses Google's Gemini 1.5 Pro for AI generated content and matching
# Last updated: April 17th, 2025

import os
import firebase_admin
from firebase_admin import credentials, firestore
import google.generativeai as genai
from flask import Flask, request, jsonify
import json
import re
import tempfile
import datetime
import logging
import uuid
from werkzeug.utils import secure_filename
from flask_cors import CORS
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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

# Get Firebase credentials path from environment variable
FIREBASE_CREDENTIALS_PATH = os.environ.get("FIREBASE_CREDENTIALS_PATH")
if not FIREBASE_CREDENTIALS_PATH:
    print("WARNING: FIREBASE_CREDENTIALS_PATH environment variable is not set")
    USE_FIREBASE = False

# Make sure the credentials file exists, otherwise use mock mode
if FIREBASE_CREDENTIALS_PATH and os.path.exists(FIREBASE_CREDENTIALS_PATH):
    USE_FIREBASE = True
else:
    if FIREBASE_CREDENTIALS_PATH:
        print(f"WARNING: Firebase credentials file not found at: {FIREBASE_CREDENTIALS_PATH}")
    print("Running in mock mode without Firebase.")
    USE_FIREBASE = False

# Initialize Firebase Admin SDK if credentials are available
if USE_FIREBASE:
    try:
        cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print(f"Successfully initialized Firebase with credentials from: {FIREBASE_CREDENTIALS_PATH}")
        # Test Firestore connection by accessing a simple collection
        try:
            test_doc = db.collection("mentorship_test").document("test").get()
            print("Firestore connection test successful")
        except Exception as conn_err:
            print(f"Note: Firestore test read failed, but initialization succeeded: {str(conn_err)}")
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
        GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-experimental")
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
    
# Default API port (can be overridden by PORT environment variable)
# IMPORTANT: This should match the port used in frontend code (defaulting to 5001)
DEFAULT_PORT = 5002

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

@app.route("/match", methods=["POST", "OPTIONS"])
def match():
    """Process mentorship signup data"""
    # Handle preflight OPTIONS request
    if request.method == "OPTIONS":
        return "", 200
        
    try:
        data = request.json
        user_id = data.get("userId")
        force_signup = data.get("forceSignup", False)  # Add option to force signup for testing

        print(f"Received signup for user {user_id}")

        # Check if user has already signed up (if Firebase is available)
        if user_id and USE_FIREBASE and db and not force_signup:
            try:
                existing_signup = db.collection("mentorship_signups").document(user_id).get()
                if existing_signup.exists:
                    # Store in variable to avoid repeated logging
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
            mentee_matches = db.collection("mentorship_matches").filter("menteeId", "==", user_id).get()
            mentor_matches = db.collection("mentorship_matches").filter("mentorId", "==", user_id).get()
            
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

# Create a dummy limiter that doesn't do anything if not defined globally
if 'limiter' not in globals():
    class DummyLimiter:
        def limit(self, *args, **kwargs):
            def decorator(f):
                return f
            return decorator
    
    limiter = DummyLimiter()
    print("Using dummy rate limiter")

@app.route("/generate-matches", methods=["POST"])
def generate_matches():
    """AI-based mentorship matching using Gemini API with enhanced storage"""
    try:
        logger.info("Received request to generate matches")
        data = request.json
        
        if not data:
            logger.warning("No data provided in generate-matches request")
            return jsonify({"error": "No data provided"}), 400
            
        mentors = data.get('mentors', [])
        mentees = data.get('mentees', [])
        max_mentees_per_mentor = data.get('maxMenteesPerMentor', 3)  # Get setting from request
        save_to_db = data.get('saveToDatabase', True)  # Default to saving matches
         
        if not mentors:
            logger.warning("No mentors provided in generate-matches request")
            return jsonify({"error": "No mentors provided"}), 400
        if not mentees:
            logger.warning("No mentees provided in generate-matches request")
            return jsonify({"error": "No mentees provided"}), 400
            
        logger.info(f"Processing match request with {len(mentors)} mentors and {len(mentees)} mentees")
        logger.info(f"Max mentees per mentor: {max_mentees_per_mentor}, Save to DB: {save_to_db}")
            
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
        # Check if AI is available first
        if not USE_AI or not GEMINI_API_KEY:
            print("AI is not available, returning mock matches")
            return generate_mock_matches(mentors, mentees)
            
        try:
            # Use Gemini 2.5
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
                    
            logger.info(f"Successfully generated {len(matches)} matches")
            
            # Validate and standardize the matches
            sanitized_matches = []
            for match in matches:
                # Create a sanitized match object with standardized fields
                sanitized_match = {}
                
                # Standardize field names
                sanitized_match["menteeId"] = match.get("menteeId", match.get("mentee", ""))
                sanitized_match["mentorId"] = match.get("mentorId", match.get("mentor", ""))
                sanitized_match["matchReason"] = match.get("matchReason", match.get("reason", "AI-generated match"))
                
                # Ensure compatibility score is a number
                try:
                    sanitized_match["compatibilityScore"] = float(match.get("compatibilityScore", match.get("score", 80)))
                except (ValueError, TypeError):
                    sanitized_match["compatibilityScore"] = 80
                    
                sanitized_match["status"] = "pending"
                sanitized_match["createdAt"] = datetime.datetime.now().isoformat()
                sanitized_match["aiGenerated"] = True
                sanitized_match["generatedAt"] = datetime.datetime.now().isoformat()
                
                # Validate required fields
                if not sanitized_match["menteeId"] or not sanitized_match["mentorId"]:
                    logger.warning(f"Skipping match with missing IDs: {sanitized_match}")
                    continue
                    
                # Add to sanitized matches list
                sanitized_matches.append(sanitized_match)
            
            # Save matches to Firestore if requested 
            stored_match_ids = []
            if save_to_db:
                if USE_FIREBASE and db:
                    try:
                        logger.info(f"Saving {len(sanitized_matches)} matches to Firestore")
                        for match in sanitized_matches:
                            # Create a document with auto-generated ID
                            match_ref = db.collection("mentorship_matches").document()
                            match_id = match_ref.id
                            
                            # Add ID to the match data
                            match["id"] = match_id
                            
                            # Save to Firestore
                            match_ref.set(match)
                            
                            # Track saved IDs
                            stored_match_ids.append(match_id)
                            
                        logger.info(f"Successfully saved {len(stored_match_ids)} matches to Firestore")
                    except Exception as e:
                        logger.error(f"Error saving matches to Firestore: {str(e)}")
                        # Continue anyway since we'll return the matches to the client
                else:
                    # Create a local storage for mock mode
                    logger.info("Firebase not available, using local storage for matches")
                    
                    # Create mock_data directory if it doesn't exist
                    mock_data_dir = os.path.join(os.path.dirname(__file__), "mock_data")
                    os.makedirs(mock_data_dir, exist_ok=True)
                    
                    # Load existing matches or create empty array
                    mock_matches_file = os.path.join(mock_data_dir, "mentorship_matches.json")
                    existing_matches = []
                    
                    if os.path.exists(mock_matches_file):
                        try:
                            with open(mock_matches_file, 'r') as f:
                                existing_matches = json.load(f)
                                logger.info(f"Loaded {len(existing_matches)} existing matches from mock storage")
                        except Exception as e:
                            logger.error(f"Error loading mock matches: {str(e)}")
                    
                    # Add new matches with generated IDs
                    for match in sanitized_matches:
                        # Generate a unique ID
                        match_id = f"mock-match-{len(existing_matches) + len(stored_match_ids) + 1}"
                        match["id"] = match_id
                        
                        # Add to storage
                        existing_matches.append(match)
                        stored_match_ids.append(match_id)
                    
                    # Save updated matches
                    try:
                        with open(mock_matches_file, 'w') as f:
                            json.dump(existing_matches, f, indent=2)
                        logger.info(f"Successfully saved {len(sanitized_matches)} matches to mock storage")
                    except Exception as e:
                        logger.error(f"Error saving to mock storage: {str(e)}")
            else:
                logger.info("Skipping database storage as requested by user")
                # Add mock IDs for consistency
                for i, match in enumerate(sanitized_matches):
                    match["id"] = f"mock-match-{i+1}"
            
            # Return the matches with tracking data
            return jsonify({
                "message": f"Successfully generated {len(sanitized_matches)} matches",
                "matches": sanitized_matches,
                "stored_match_ids": stored_match_ids,
                "saved_to_database": len(stored_match_ids) > 0
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
    logger.info("Generating mock matches as fallback")
    matches = []
    stored_match_ids = []
    
    # Distribute mentees across mentors
    mentor_index = 0
    for i, mentee in enumerate(mentees):
        mentor = mentors[mentor_index]
        
        # Create compatibility score (70-95 range)
        score = 70 + (i % 25)
        
        # Get IDs, ensuring they exist
        mentee_id = mentee.get("id", f"mentee-{i}")
        mentor_id = mentor.get("id", f"mentor-{mentor_index}")
        
        # Create standardized match object
        match = {
            "menteeId": mentee_id,
            "mentorId": mentor_id,
            "matchReason": f"Match based on compatible academic interests and mentorship expectations.",
            "compatibilityScore": score,
            "status": "pending",
            "createdAt": datetime.datetime.now().isoformat(),
            "aiGenerated": True,
            "isMockData": True,
            "generatedAt": datetime.datetime.now().isoformat()
        }
        
        matches.append(match)
        
        # Move to next mentor, loop back if needed
        mentor_index = (mentor_index + 1) % len(mentors)
    
    logger.info(f"Generated {len(matches)} mock matches")
    
    # Save mock matches to Firestore if available
    if USE_FIREBASE and db:
        try:
            logger.info("Saving mock matches to Firestore")
            for match in matches:
                # Create a document with auto-generated ID
                match_ref = db.collection("mentorship_matches").document()
                match_id = match_ref.id
                
                # Add ID to the match data
                match["id"] = match_id
                
                # Save to Firestore
                match_ref.set(match)
                
                # Track saved IDs
                stored_match_ids.append(match_id)
                
            logger.info(f"Successfully saved {len(stored_match_ids)} mock matches to Firestore")
        except Exception as e:
            logger.error(f"Error saving mock matches to Firestore: {str(e)}")
    else:
        logger.info("Firebase not available, skipping database storage for mock matches")
        # Add mock IDs for consistency
        for i, match in enumerate(matches):
            match["id"] = f"mock-match-{i+1}"
    
    return jsonify({
        "message": "Generated mock matches (AI matching failed)",
        "matches": matches,
        "stored_match_ids": stored_match_ids,
        "saved_to_database": len(stored_match_ids) > 0,
        "is_mock_data": True
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

@app.route("/create-test-match", methods=["POST"])
def create_test_match():
    """Create a test match between a mentor and mentee with the approved status"""
    try:
        data = request.json
        mentor_id = data.get('mentorId')
        mentee_id = data.get('menteeId')
        
        if not mentor_id or not mentee_id:
            logger.warning("Missing required fields for test match creation")
            return jsonify({"error": "Both mentorId and menteeId are required"}), 400
            
        # Create a test match
        match_data = {
            "mentorId": mentor_id,
            "menteeId": mentee_id,
            "status": "approved",  # Set to approved so it can be confirmed/rejected
            "matchReason": "This is a test match created for demonstration purposes.",
            "compatibilityScore": 90,
            "createdAt": datetime.datetime.now().isoformat(),
            "isTestMatch": True
        }
        
        logger.info(f"Creating test match between mentor {mentor_id} and mentee {mentee_id}")
        
        # For testing in mock mode
        if not USE_FIREBASE or not db:
            logger.info("Creating mock test match")
            match_data["id"] = "test-match-" + str(uuid.uuid4())[:8]
            return jsonify({
                "success": True,
                "message": "Test match created successfully (MOCK)",
                "match": match_data
            })
            
        # Add to Firestore
        match_ref = db.collection("mentorship_matches").document()
        match_id = match_ref.id
        match_data["id"] = match_id
        match_ref.set(match_data)
        
        logger.info(f"Created test match {match_id} between mentor {mentor_id} and mentee {mentee_id}")
        
        return jsonify({
            "success": True,
            "message": "Test match created successfully",
            "matchId": match_id,
            "match": match_data
        })
    except Exception as e:
        logger.error(f"Error creating test match: {str(e)}")
        return jsonify({"error": str(e)}), 500



@app.route("/update-match-status", methods=["POST"])
def update_match_status():
    """Update the status of a mentorship match"""
    try:
        data = request.json
        match_id = data.get("matchId")
        status = data.get("status")
        user_id = data.get("userId")
        
        if not match_id or not status or not user_id:
            return jsonify({
                "error": "Missing required fields: matchId, status, and userId are required"
            }), 400
            
        # Validate status
        valid_statuses = ["pending", "approved", "confirmed", "rejected"]
        if status not in valid_statuses:
            return jsonify({
                "error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            }), 400
            
        # For mock mode - update in local storage
        if not USE_FIREBASE or not db:
            print(f"Using local storage to update match {match_id} to status {status}")
            mock_data_dir = os.path.join(os.path.dirname(__file__), "mock_data")
            mock_matches_file = os.path.join(mock_data_dir, "mentorship_matches.json")
            
            if os.path.exists(mock_matches_file):
                try:
                    # Load existing matches
                    with open(mock_matches_file, 'r') as f:
                        all_matches = json.load(f)
                    
                    # Find and update the match
                    found_match = False
                    for match in all_matches:
                        if match.get("id") == match_id:
                            # Verify user is authorized
                            if match.get("mentorId") != user_id and match.get("menteeId") != user_id:
                                return jsonify({
                                    "error": "Unauthorized. User is not associated with this match."
                                }), 403
                            
                            # Update match status
                            match["status"] = status
                            match["updatedAt"] = datetime.datetime.now().isoformat()
                            match["updatedBy"] = user_id
                            found_match = True
                            break
                    
                    if not found_match:
                        return jsonify({
                            "error": f"Match with ID {match_id} not found"
                        }), 404
                    
                    # Save updated matches
                    with open(mock_matches_file, 'w') as f:
                        json.dump(all_matches, f, indent=2)
                    
                    print(f"Successfully updated match {match_id} status to {status}")
                    return jsonify({
                        "success": True,
                        "message": f"Match status updated to {status}",
                        "timestamp": datetime.datetime.now().isoformat()
                    })
                    
                except Exception as e:
                    print(f"Error updating match in mock storage: {str(e)}")
                    return jsonify({
                        "error": str(e)
                    }), 500
            
            # If file doesn't exist, return success anyway for testing
            return jsonify({
                "success": True,
                "message": f"Match status updated to {status} (mock mode)",
                "timestamp": datetime.datetime.now().isoformat()
            })
            
        try:
            # Get the match to verify the user is authorized to update it
            match_ref = db.collection("mentorship_matches").document(match_id)
            match_doc = match_ref.get()
            
            if not match_doc.exists:
                return jsonify({
                    "error": f"Match with ID {match_id} not found"
                }), 404
                
            match_data = match_doc.to_dict()
            
            # Verify user is authorized (must be the mentor or mentee of this match)
            if match_data.get("mentorId") != user_id and match_data.get("menteeId") != user_id:
                return jsonify({
                    "error": "Unauthorized. User is not associated with this match."
                }), 403
                
            # Update the match status
            update_data = {
                "status": status,
                "updatedAt": datetime.datetime.now().isoformat(),
                "updatedBy": user_id
            }
            
            match_ref.update(update_data)
            
            return jsonify({
                "success": True,
                "message": f"Match status updated to {status}",
                "timestamp": datetime.datetime.now().isoformat()
            })
            
        except Exception as e:
            print(f"Error updating match status in Firestore: {str(e)}")
            return jsonify({
                "error": str(e)
            }), 500
            
    except Exception as e:
        print(f"Error in update_match_status: {str(e)}")
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
    # Use environment variable for port with fallback to default
    port = int(os.environ.get("PORT", DEFAULT_PORT))
    app.run(debug=True, host='0.0.0.0', port=port)
