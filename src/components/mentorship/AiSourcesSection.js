import React from "react";

const AiSourcesSection = ({
  handleFileSelect,
  resumeFile,
  linkedinProfile,
  setLinkedinProfile,
  processLinkedInProfile,
  processingContent,
  aiSuggestions,
  styles
}) => {
  return (
    <div style={styles.aiSourcesContainer}>
      <h3 style={styles.sourceTitle}>Generate Application Content with AI</h3>
      <p style={styles.helperText}>Choose one of these options to let AI help you fill out the application</p>
      
      {/* Resume Upload Option - Direct File Processing */}
      <div style={styles.aiSourceOption}>
        <h4 style={styles.optionTitle}>Option 1: Resume Upload</h4>
        <input 
          type="file" 
          accept=".pdf,.docx,.txt" 
          onChange={handleFileSelect} 
          style={styles.fileInput} 
        />
        {resumeFile && <p style={styles.successText}>File selected: {resumeFile.name}</p>}
      </div>
      
      {/* LinkedIn Option */}
      <div style={styles.aiSourceOption}>
        <h4 style={styles.optionTitle}>Option 2: LinkedIn Profile</h4>
        <div style={styles.inputGroup}>
          <input 
            type="url" 
            value={linkedinProfile} 
            onChange={(e) => setLinkedinProfile(e.target.value)} 
            placeholder="https://linkedin.com/in/your-profile" 
            style={styles.input} 
          />
          <button 
            type="button" 
            onClick={processLinkedInProfile} 
            disabled={!linkedinProfile || processingContent}
            style={styles.actionButton}
          >
            Analyze
          </button>
        </div>
      </div>
      
      {processingContent && <p style={styles.statusText}>Analyzing your information with AI...</p>}
      {aiSuggestions && (
        <div style={styles.suggestionControls}>
          <p style={styles.successText}>AI content generated! Content is ready to use.</p>
        </div>
      )}
    </div>
  );
};

export default AiSourcesSection;