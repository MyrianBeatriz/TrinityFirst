import React, { useState, useEffect } from 'react';

const Home = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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
      background: 'linear-gradient(45deg, rgba(26,54,93,0.95) 0%, rgba(26,54,93,0.8) 100%)'
    },
    heading: {
      fontSize: isMobile ? '2.5rem' : '3.5rem',
      marginBottom: '1.5rem',
      position: 'relative',
      fontWeight: 'bold'
    },
    yellowText: {
      color: '#FED102',
      display: 'block',
      marginTop: '0.5rem'
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 1rem',
      position: 'relative',
      zIndex: 1
    },
    subheading: {
      fontSize: '1.25rem',
      marginBottom: '2rem',
      lineHeight: '1.8',
      maxWidth: '800px',
      margin: '0 auto 2rem'
    },
    button: {
      backgroundColor: '#FED102',
      color: '#1a365d',
      padding: '1rem 2rem',
      border: 'none',
      borderRadius: '30px',
      fontSize: '1.1rem',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'transform 0.2s ease',
      marginRight: '1rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      color: 'white',
      padding: '0.9rem 2rem',
      border: '2px solid white',
      borderRadius: '30px',
      fontSize: '1.1rem',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'all 0.2s ease'
    },
    featuresSection: {
      backgroundColor: 'white',
      padding: '6rem 2rem'
    },
    featureGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
      gap: '2rem',
      margin: '3rem auto',
      maxWidth: '1200px',
      overflow: 'hidden'
    },
    feature: {
      padding: '2rem',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      textAlign: 'center',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      cursor: 'default',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    },
    featureIcon: {
      fontSize: '2.5rem',
      marginBottom: '1.5rem',
      display: 'block',
      textAlign: 'center'
    },
    featureTitle: {
      fontSize: '1.5rem',
      color: '#1a365d',
      marginBottom: '1rem',
      fontWeight: 'bold',
      textAlign: 'center'
    },
    featureDescription: {
      lineHeight: '1.7',
      color: '#4a5568',
      fontSize: '1.1rem',
      flex: 1,
      textAlign: 'center'
    },
    ctaSection: {
      backgroundColor: '#f8f9fa',
      padding: '4rem 2rem',
      textAlign: 'center'
    },
    ctaButton: {
      backgroundColor: '#1a365d',
      color: 'white',
      padding: '1rem 2rem',
      border: 'none',
      borderRadius: '30px',
      fontSize: '1.1rem',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'background-color 0.2s ease'
    }
  };

  const features = [
    {
      title: "Vibrant Community",
      description: "Join a thriving network of first-generation students across all class years. Share experiences, celebrate successes, and support each other through challenges. Our community members understand your unique journey and are here to help you navigate college life.",
      icon: "👥"
    },
    {
      title: "Personalized Mentorship",
      description: "Connect with experienced upper-class students and alumni who have walked your path. Our mentorship program pairs you with mentors who share your academic interests and career goals, providing guidance, support, and invaluable insights.",
      icon: "🤝"
    },
    {
      title: "Monthly Workshops",
      description: "Gain practical skills through targeted workshops on essential topics like academic success, financial literacy, career preparation, and personal development. Learn from experts and peers in an engaging, supportive environment.",
      icon: "📚"
    }
  ];

  return (
    <div>
      <section style={styles.hero}>
        <div style={styles.heroOverlay}></div>
        <div style={styles.container}>
          <h1 style={styles.heading}>
            Welcome to Trinity First
            <span style={styles.yellowText}>Your First-Gen Community</span>
          </h1>
          <p style={styles.subheading}>
            Join a supportive community dedicated to helping first-generation college students
            navigate, excel, and thrive at Trinity College. Together, we're building a network
            of support, success, and shared experiences.
          </p>
          <div>
            <button
              style={styles.button}
              onMouseOver={e => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.target.style.transform = 'translateY(0)'}
            >
              Join Our Community
            </button>
            <button
              style={styles.secondaryButton}
              onMouseOver={e => {
                e.target.style.backgroundColor = 'white';
                e.target.style.color = '#1a365d';
              }}
              onMouseOut={e => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'white';
              }}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      <section style={styles.featuresSection}>
        <div style={styles.container}>
          <h2 style={{fontSize: isMobile ? '2rem' : '2.5rem', textAlign: 'center', color: '#1a365d', marginBottom: '1rem', fontWeight: 'bold'}}>
            Why Join Trinity First?
          </h2>
          <p style={{textAlign: 'center', color: '#4a5568', maxWidth: '700px', margin: '0 auto 3rem', fontSize: '1.1rem'}}>
            We're more than just a program - we're a community of students supporting each other
            through the unique experiences of being first-generation college students.
          </p>
          <div style={styles.featureGrid}>
            {features.map((feature, index) => (
              <div
                key={index}
                style={styles.feature}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                }}
              >
                <div style={styles.featureIcon}>{feature.icon}</div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={styles.ctaSection}>
        <div style={styles.container}>
          <h2 style={{fontSize: isMobile ? '2rem' : '2.5rem', color: '#1a365d', marginBottom: '1.5rem', fontWeight: 'bold'}}>
            Ready to Begin Your Journey?
          </h2>
          <p style={{color: '#4a5568', maxWidth: '600px', margin: '0 auto 2rem', fontSize: '1.1rem'}}>
            Take the first step towards building your college success story.
            Join our community of first-generation students today.
          </p>
          <button
            style={styles.ctaButton}
            onMouseOver={e => e.target.style.backgroundColor = '#234674'}
            onMouseOut={e => e.target.style.backgroundColor = '#1a365d'}
          >
            Join Trinity First Today
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;
