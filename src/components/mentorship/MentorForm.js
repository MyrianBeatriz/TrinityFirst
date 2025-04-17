import React from "react";

const MentorForm = ({
  academicInterests, setAcademicInterests,
  extracurriculars, setExtracurriculars,
  mentorMotivation, setMentorMotivation,
  firstGenChallenges, setFirstGenChallenges,
  mentorStrengths, setMentorStrengths,
  communicationStyle, setCommunicationStyle,
  desiredSupport, setDesiredSupport,
  mentorTopics, handleTopicChange,
  styles
}) => {
  return (
    <>
      {/* Academic Interests and Career Goals */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          What are your academic interests and career goals?
        </label>
        <textarea 
          value={academicInterests} 
          onChange={(e) => setAcademicInterests(e.target.value)} 
          style={styles.textarea}
          required
        />
      </div>

      {/* Extracurricular Activities */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          What extracurricular activities, clubs, or organizations are you involved in?
        </label>
        <textarea 
          value={extracurriculars} 
          onChange={(e) => setExtracurriculars(e.target.value)} 
          style={styles.textarea}
          required
        />
      </div>

      {/* Mentor Motivation */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          Why do you want to be a mentor in this program?
        </label>
        <textarea 
          value={mentorMotivation} 
          onChange={(e) => setMentorMotivation(e.target.value)} 
          style={styles.textarea}
          required
        />
      </div>

      {/* First-Gen Challenges */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          What challenges did you face as a first-generation student that you want to help others navigate?
        </label>
        <textarea 
          value={firstGenChallenges} 
          onChange={(e) => setFirstGenChallenges(e.target.value)} 
          style={styles.textarea}
          required
        />
      </div>

      {/* Mentor Strengths */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          What strengths do you bring as a mentor?
        </label>
        <textarea 
          value={mentorStrengths} 
          onChange={(e) => setMentorStrengths(e.target.value)} 
          style={styles.textarea}
          required
        />
      </div>

      {/* Communication Style */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          How would you describe your communication and leadership style?
        </label>
        <textarea 
          value={communicationStyle} 
          onChange={(e) => setCommunicationStyle(e.target.value)} 
          style={styles.textarea}
          required
        />
      </div>

      {/* Desired Support */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          What kind of support do you wish you had when you started college?
        </label>
        <textarea 
          value={desiredSupport} 
          onChange={(e) => setDesiredSupport(e.target.value)} 
          style={styles.textarea}
          required
        />
      </div>

      {/* Mentoring Topics */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          What topics do you feel most comfortable guiding a mentee on? (Check all that apply)
        </label>
        <div style={styles.checkboxGroup}>
          <div style={styles.checkboxItem}>
            <input 
              type="checkbox"
              id="collegeLife"
              checked={mentorTopics.collegeLife}
              onChange={() => handleTopicChange('collegeLife')}
            />
            <label htmlFor="collegeLife">Navigating college life</label>
          </div>
          <div style={styles.checkboxItem}>
            <input 
              type="checkbox"
              id="studySkills"
              checked={mentorTopics.studySkills}
              onChange={() => handleTopicChange('studySkills')}
            />
            <label htmlFor="studySkills">Study skills & time management</label>
          </div>
          <div style={styles.checkboxItem}>
            <input 
              type="checkbox"
              id="campusResources"
              checked={mentorTopics.campusResources}
              onChange={() => handleTopicChange('campusResources')}
            />
            <label htmlFor="campusResources">Finding campus resources</label>
          </div>
          <div style={styles.checkboxItem}>
            <input 
              type="checkbox"
              id="careerExploration"
              checked={mentorTopics.careerExploration}
              onChange={() => handleTopicChange('careerExploration')}
            />
            <label htmlFor="careerExploration">Career exploration & internships</label>
          </div>
          <div style={styles.checkboxItem}>
            <input 
              type="checkbox"
              id="financialAid"
              checked={mentorTopics.financialAid}
              onChange={() => handleTopicChange('financialAid')}
            />
            <label htmlFor="financialAid">Financial aid & budgeting</label>
          </div>
          <div style={styles.checkboxItem}>
            <input 
              type="checkbox"
              id="buildingConfidence"
              checked={mentorTopics.buildingConfidence}
              onChange={() => handleTopicChange('buildingConfidence')}
            />
            <label htmlFor="buildingConfidence">Building confidence as a first-gen student</label>
          </div>
        </div>
      </div>
    </>
  );
};

export default MentorForm;