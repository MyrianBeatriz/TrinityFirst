import React from "react";

const MenteeForm = ({
  expectations, setExpectations,
  careerGoals, setCareerGoals,
  challenges, setChallenges,
  experienceSummary, setExperienceSummary,
  styles
}) => {
  return (
    <>
      {/* Expectations - for mentees */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          What are your expectations from this mentorship?
        </label>
        <textarea 
          value={expectations} 
          onChange={(e) => setExpectations(e.target.value)} 
          style={styles.textarea}
          required
        />
      </div>

      {/* Career Goals */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          What are your short-term and long-term career goals?
        </label>
        <textarea 
          value={careerGoals} 
          onChange={(e) => setCareerGoals(e.target.value)} 
          style={styles.textarea}
          required
        />
      </div>

      {/* Challenges */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          What challenges have you faced in your academic or career journey?
        </label>
        <textarea 
          value={challenges} 
          onChange={(e) => setChallenges(e.target.value)} 
          style={styles.textarea}
          required
        />
      </div>

      {/* Experience Summary */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          Describe your academic and professional experience so far.
        </label>
        <textarea 
          value={experienceSummary} 
          onChange={(e) => setExperienceSummary(e.target.value)} 
          style={styles.textarea}
          required
        />
      </div>
    </>
  );
};

export default MenteeForm;