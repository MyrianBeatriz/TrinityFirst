import React, { useState, useEffect } from 'react';

const About = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const values = [
    {
      title: "Community",
      description: "Fostering a supportive network where students can share experiences, celebrate successes, and help each other overcome challenges."
    },
    {
      title: "Empowerment",
      description: "Providing resources and opportunities that enable students to take charge of their academic journey and personal growth."
    }
  ];

  const teamMembers = [
    {
      name: "Roberta Rogers",
      role: "Staff member",
      description: "Develops strategies for orientation, leadership, and retention. A Trinity alumna, legacy, and parent of a Trinity graduate, deeply connected to the college's mission."
    },
    {
      name: "Olivia Corso",
      role: "Staff member",
      description: "Manages operations and student engagement at Trinity's Career & Life Design Center while mentoring interns. Passionate about mentoring and creating exceptional experiences."
    },
    {
      name: "Myri Ayala",
      role: "Computer Science Student",
      description: "A senior from Paraguay dedicated to supporting first-generation students, inspired by her own journey and the connections that helped her succeed in college."
    }
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const styles = {
    hero: {
      backgroundColor: '#1a365d',
      color: 'white',
      padding: '4rem 2rem',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    },
    heroOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, rgba(26,54,93,0.98) 0%, rgba(26,54,93,0.95) 100%)'
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 1rem',
      position: 'relative',
      zIndex: 1
    },
    section: {
      padding: '3rem 0',
      backgroundColor: 'white',
    },
    heading: {
      fontSize: isMobile ? '2.5rem' : '3.5rem',
      color: 'white',
      marginBottom: '1.5rem',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    subHeading: {
      fontSize: '2rem',
      color: '#1a365d',
      marginBottom: '1.5rem',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    lightSubHeading: {
      fontSize: '2rem',
      color: 'white',
      marginBottom: '1.5rem',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    text: {
      fontSize: '1.1rem',
      lineHeight: '1.7',
      color: '#4a5568',
      marginBottom: '1.5rem',
      maxWidth: '800px',
      margin: '0 auto 1.5rem',
    },
    lightText: {
      fontSize: '1.1rem',
      lineHeight: '1.7',
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: '1.5rem',
      maxWidth: '800px',
      margin: '0 auto 1.5rem',
    },
    highlightedSection: {
      backgroundColor: '#1a365d',
      padding: '3rem 0',
    },
    valuesGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap: '2rem',
      maxWidth: '1000px',
      margin: '3rem auto',
    },
    valueCard: {
      padding: '2rem',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    },
    teamGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
      gap: '2rem',
      maxWidth: '1200px',
      margin: '3rem auto',
    },
    teamMember: {
      padding: '2rem',
      backgroundColor: 'white',
      borderRadius: '12px',
      textAlign: 'center',
      transition: 'transform 0.2s ease',
      height: '100%',
    },
    roleText: {
      backgroundColor: '#FED102',
      color: '#1a365d',
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      display: 'inline-block',
      marginBottom: '1rem',
      fontWeight: 'bold'
    }
  };

  return (
    <div>
      <section style={styles.hero}>
        <div style={styles.heroOverlay}></div>
        <div style={styles.container}>
          <h1 style={styles.heading}>About Trinity First</h1>
          <p style={{...styles.text, color: 'white', opacity: 0.9}}>
            Trinity First began as Orientation-Next, an interactive program designed to help first-generation students transition successfully to college life. Now, we're growing into a year-round program that goes beyond orientation week.
          </p>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.container}>
          <h2 style={styles.subHeading}>Our Vision</h2>
          <p style={styles.text}>
            We envision a campus community where first-generation students thrive academically,
            socially, and professionally, contributing their unique perspectives and talents to
            enrich the Trinity College experience for all.
          </p>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.container}>
          <h2 style={styles.subHeading}>Our Values</h2>
          <div style={styles.valuesGrid}>
            {values.map((value, index) => (
              <div
                key={index}
                style={{...styles.valueCard, border: '1px solid rgba(254, 209, 2, 0.3)'}}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = '#FED102';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'rgba(254, 209, 2, 0.3)';
                }}
              >
                <h3 style={{color: '#1a365d', fontWeight: 'bold', marginBottom: '1rem', fontSize: '1.5rem'}}>
                  {value.title}
                </h3>
                <p style={{color: '#4a5568', lineHeight: '1.7'}}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{...styles.highlightedSection}}>
        <div style={styles.container}>
          <h2 style={styles.lightSubHeading}>Our Team</h2>
          <div style={styles.teamGrid}>
            {teamMembers.map((member, index) => (
              <div
                key={index}
                style={{...styles.teamMember, border: '1px solid rgba(254, 209, 2, 0.3)'}}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = '#FED102';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'rgba(254, 209, 2, 0.3)';
                }}
              >
                <h3 style={{color: '#1a365d', fontWeight: 'bold', marginBottom: '0.5rem'}}>
                  {member.name}
                </h3>
                <div style={styles.roleText}>
                  {member.role}
                </div>
                <p style={{color: '#4a5568'}}>{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
