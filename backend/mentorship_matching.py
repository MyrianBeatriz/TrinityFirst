import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Get allowed origins from environment variable with fallback for development
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
allowed_origins_list = [origin.strip() for origin in allowed_origins.split(",")]
CORS(app, origins=allowed_origins_list)  # Only allow specific origins

# Load API key from environment variable
def configure_gemini_api():
    """Configure Gemini API with API key from environment variable"""
    try:
        # Get API key from environment variable
        api_key = os.getenv("GEMINI_API_KEY")
        
        if not api_key:
            logger.error("GEMINI_API_KEY not found in environment variables")
            # No hardcoded API key - fail gracefully
            return False
            
        logger.info(f"Configuring Gemini API with key {api_key[:5]}...{api_key[-4:]}")
        
        # Configure API
        genai.configure(api_key=api_key)
        
        # Verify configuration by listing models
        models = genai.list_models()
        model_names = [model.name for model in models]
        logger.info(f"Available models: {', '.join(model_names)}")
        
        return True
    except Exception as e:
        logger.error(f"Error configuring Gemini API: {str(e)}")
        return False

# Configure API at startup
api_configured = configure_gemini_api()

# Set up the model
if api_configured:
    try:
        model = genai.GenerativeModel('gemini-2.5-experimental')
        logger.info("Successfully created Gemini model instance")
    except Exception as e:
        logger.error(f"Error creating model: {str(e)}")
        model = None
else:
    model = None
    logger.warning("Gemini API not configured properly. Match generation will use mock data.")

def validate_mentor_data(mentor):
    """Validate mentor data structure"""
    required_fields = ['id', 'name']
    for field in required_fields:
        if field not in mentor or not mentor[field]:
            return False
    return True

def validate_mentee_data(mentee):
    """Validate mentee data structure"""
    required_fields = ['id', 'name']
    for field in required_fields:
        if field not in mentee or not mentee[field]:
            return False
    return True

@app.route('/generate-matches', methods=['POST'])
def generate_matches():
    # Check if API is configured
    if not api_configured or model is None:
        logger.warning("Gemini API not configured, redirecting to mock matches")
        return mock_matches()
    
    try:
        # Get mentorship data from request
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        mentors = data.get('mentors', [])
        mentees = data.get('mentees', [])
        
        if not mentors:
            return jsonify({"error": "No mentors provided"}), 400
        if not mentees:
            return jsonify({"error": "No mentees provided"}), 400
            
        # Validate data structure
        invalid_mentors = [mentor['id'] for mentor in mentors if not validate_mentor_data(mentor)]
        invalid_mentees = [mentee['id'] for mentee in mentees if not validate_mentee_data(mentee)]
        
        if invalid_mentors:
            return jsonify({
                "error": "Invalid mentor data", 
                "invalid_ids": invalid_mentors
            }), 400
            
        if invalid_mentees:
            return jsonify({
                "error": "Invalid mentee data", 
                "invalid_ids": invalid_mentees
            }), 400
        
        # Create a prompt for Gemini
        prompt = create_matching_prompt(mentors, mentees)
        
        # Generate matches using Gemini
        logger.info(f"Sending prompt to Gemini (length: {len(prompt)} chars)")
        response = model.generate_content(prompt)
        
        if not response or not response.text:
            logger.error("Empty response from Gemini API")
            return jsonify({
                "error": "Empty response from AI model",
                "matches": []
            }), 500
            
        # Parse and validate the response
        matches, errors = parse_gemini_response(response.text)
        
        # Return matches with any parsing errors
        return jsonify({
            "matches": matches,
            "errors": errors if errors else None
        })
    
    except Exception as e:
        logger.exception(f"Error generating matches: {str(e)}")
        return jsonify({"error": str(e)}), 500

def create_matching_prompt(mentors, mentees):
    """Create a structured prompt for Gemini to match mentors with mentees"""
    # Calculate max mentees per mentor
    max_mentees_per_mentor = max(1, (len(mentees) // len(mentors)) + 1)
    
    prompt = f"""
    You are an AI assistant helping match mentors with mentees in a university mentorship program.
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
        Name: {mentor.get('name')}
        Major: {mentor.get('major', 'Not specified')}
        Academic Interests: {mentor.get('academicInterests', 'Not specified')}
        Mentor Strengths: {mentor.get('mentorStrengths', 'Not specified')}
        Mentor Topics: {json.dumps(mentor.get('mentorTopics', {}))}
        """
    
    prompt += "\nMENTEES:"
    
    # Add mentee details
    for mentee in mentees:
        prompt += f"""
        Mentee ID: {mentee.get('id')}
        Name: {mentee.get('name')}
        Major: {mentee.get('major', 'Not specified')}
        Career Goals: {mentee.get('careerGoals', 'Not specified')}
        Challenges: {mentee.get('challenges', 'Not specified')}
        Expectations: {mentee.get('expectations', 'Not specified')}
        """
    
    prompt += """
    Return ONLY a valid JSON array of matches, with NO additional text before or after the JSON.
    """
    
    return prompt

def parse_gemini_response(response_text):
    """Parse Gemini response text into structured match data"""
    errors = []
    
    try:
        # Extract JSON from the response
        if "```json" in response_text:
            # Extract content between ```json and ```
            json_text = response_text.split("```json")[1].split("```")[0].strip()
            logger.info("Extracted JSON from code block")
        elif "```" in response_text:
            # Extract content between ``` and ```
            json_text = response_text.split("```")[1].strip()
            logger.info("Extracted text from code block")
        else:
            json_text = response_text.strip()
        
        # Parse the JSON
        matches = json.loads(json_text)
        
        if not isinstance(matches, list):
            errors.append("Response is not a list of matches")
            return [], errors
            
        # Validate the format of each match
        valid_matches = []
        for i, match in enumerate(matches):
            match_errors = []
            
            # Check required fields
            required_fields = ["menteeId", "mentorId", "reason", "score"]
            for field in required_fields:
                if field not in match:
                    match_errors.append(f"Missing required field: {field}")
            
            # Validate score is a number between 0-100
            if "score" in match:
                try:
                    score = float(match["score"])
                    if score < 0 or score > 100:
                        match_errors.append(f"Score must be between 0-100, got: {score}")
                except (ValueError, TypeError):
                    match_errors.append(f"Score must be a number, got: {match['score']}")
            
            if match_errors:
                errors.append(f"Match #{i+1} has errors: {', '.join(match_errors)}")
            else:
                valid_matches.append(match)
        
        return valid_matches, errors
    
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON from response: {e}")
        errors.append(f"JSON parsing error: {str(e)}")
        # Return the first 100 chars of response for debugging
        preview = response_text[:100] + "..." if len(response_text) > 100 else response_text
        errors.append(f"Response preview: {preview}")
        return [], errors
    
    except Exception as e:
        logger.exception(f"Error parsing response: {str(e)}")
        errors.append(f"Parsing error: {str(e)}")
        return [], errors

# Health check endpoint with API configuration status
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "service": "Mentorship Matching API",
        "version": "1.0.1",
        "gemini_api_configured": api_configured,
        "model_available": model is not None
    })

@app.route('/mock-matches', methods=['POST'])
def mock_matches():
    """Generate mock matches when Gemini API is not available"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        mentors = data.get('mentors', [])
        mentees = data.get('mentees', [])
        
        if not mentors:
            return jsonify({"error": "No mentors provided"}), 400
        if not mentees:
            return jsonify({"error": "No mentees provided"}), 400
        
        # Create mock matches with balanced mentor loads
        matches = []
        mentor_counts = {mentor.get("id"): 0 for mentor in mentors}
        
        for mentee in mentees:
            # Find mentor with fewest assignments
            mentor_id = min(mentor_counts, key=mentor_counts.get)
            mentor = next((m for m in mentors if m.get("id") == mentor_id), mentors[0])
            
            # Get mentee and mentor names for the reason
            mentee_name = mentee.get("name", "Mentee")
            mentor_name = mentor.get("name", "Mentor")
            
            # Create compatibility score based on major match
            score = 70  # Base score
            if mentee.get("major") == mentor.get("major"):
                score += 20  # Bonus for same major
            
            matches.append({
                "menteeId": mentee.get("id"),
                "mentorId": mentor_id,
                "reason": f"Mock match: {mentor_name} and {mentee_name} are compatible based on profile analysis.",
                "score": score
            })
            
            # Update mentor assignment count
            mentor_counts[mentor_id] += 1
        
        return jsonify({
            "matches": matches,
            "mock": True
        })
        
    except Exception as e:
        logger.exception(f"Error generating mock matches: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    logger.info(f"Starting Mentorship Matching API on port {port}")
    
    if api_configured:
        logger.info("✅ Gemini API configured successfully")
    else:
        logger.warning("❌ WARNING: Gemini API not configured properly. Using mock data.")
        logger.info("   Try using the /mock-matches endpoint instead of /generate-matches")
    
    app.run(host='0.0.0.0', port=port, debug=True)