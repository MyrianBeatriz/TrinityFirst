import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase';

const Stories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);

  useEffect(() => {
    setLoading(true);

    // Create a query to get stories ordered by creation date
    const storiesQuery = query(
      collection(firestore, "stories"),
      orderBy("lastUpdated", "desc")
    );

    // Set up a real-time listener
    const unsubscribe = onSnapshot(storiesQuery, (snapshot) => {
      const storiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setStories(storiesData);
      setLoading(false);
      console.log("Stories updated:", storiesData.length);
    }, (error) => {
      console.error("Error fetching stories:", error);
      setLoading(false);
    });

    // Clean up the listener when component unmounts
    return () => unsubscribe();
  }, []);

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Function to open story modal
  const openStory = (story) => {
    setSelectedStory(story);
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  };

  // Function to close story modal
  const closeStory = () => {
    setSelectedStory(null);
    document.body.style.overflow = 'auto'; // Re-enable scrolling
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <h1 style={styles.loadingText}>Loading Success Stories...</h1>
          <div style={styles.spinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Success Stories</h1>
        <p style={styles.subtitle}>
        Discover inspiring stories from fellow first-generation students and explore the exciting things they're accomplishing on campus!
        </p>
      </div>

      {stories.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No success stories available yet. Check back soon!</p>
        </div>
      ) : (
        <div style={styles.storiesContainer}>
          {/* Featured story (first story) */}
          {stories[0] && (
            <div style={styles.featuredStory} onClick={() => openStory(stories[0])}>
              <div style={styles.featuredContent}>
                <span style={styles.featuredLabel}>Featured Story</span>
                <h2 style={styles.featuredTitle}>{stories[0].title}</h2>
                <p style={styles.featuredAuthor}>By {stories[0].author}</p>
                <p style={styles.featuredPreview}>
                  {stories[0].content.length > 250 
                    ? `${stories[0].content.substring(0, 250)}...` 
                    : stories[0].content}
                </p>
                <button style={styles.readMoreButton}>Read Full Story</button>
              </div>
              {stories[0].imageUrl && (
                <div style={styles.featuredImageContainer}>
                  <img 
                    src={stories[0].imageUrl} 
                    alt={stories[0].title} 
                    style={styles.featuredImage}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/500x300?text=No+Image+Available";
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Grid of other stories */}
          <div style={styles.storiesGrid}>
            {stories.slice(1).map((story) => (
              <div key={story.id} style={styles.storyCard} onClick={() => openStory(story)}>
                {story.imageUrl && (
                  <div style={styles.imageContainer}>
                    <img 
                      src={story.imageUrl} 
                      alt={story.title} 
                      style={styles.storyImage} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
                      }}
                    />
                  </div>
                )}
                <div style={styles.storyContent}>
                  <h2 style={styles.storyTitle}>{story.title}</h2>
                  <p style={styles.storyAuthor}>By {story.author}</p>
                  <p style={styles.storyPreview}>
                    {story.content.length > 150 
                      ? `${story.content.substring(0, 150)}...` 
                      : story.content}
                  </p>
                  <div style={styles.storyFooter}>
                    <span style={styles.storyDate}>{formatDate(story.createdAt)}</span>
                    <button style={styles.readButton}>Read More</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for reading full story */}
      {selectedStory && (
        <div style={styles.modalBackdrop} onClick={closeStory}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={closeStory}>×</button>
            
            {selectedStory.imageUrl && (
              <div style={styles.modalImageContainer}>
                <img 
                  src={selectedStory.imageUrl} 
                  alt={selectedStory.title} 
                  style={styles.modalImage}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/800x400?text=Image+Not+Available";
                  }}
                />
              </div>
            )}
            
            <div style={styles.modalBody}>
              <h2 style={styles.modalTitle}>{selectedStory.title}</h2>
              <p style={styles.modalAuthor}>By {selectedStory.author} • {formatDate(selectedStory.createdAt)}</p>
              
              <div style={styles.modalText}>
                {selectedStory.content.split('\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call to Action Section */}
      <div style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>Share Your Story</h2>
        <p style={styles.ctaText}>
          Are you a first-generation student with a success story to share? 
          Let us know about your journey and inspire others!
        </p>
        <button 
          style={styles.ctaButton}
          onClick={() => window.location.href = '/contact'}
        >
          Contact Us
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "2rem auto",
    padding: "0 1.5rem"
  },
  header: {
    textAlign: "center",
    marginBottom: "3rem"
  },
  title: {
    fontSize: "2.5rem",
    color: "#1a365d",
    marginBottom: "1rem"
  },
  subtitle: {
    fontSize: "1.1rem",
    color: "#4a5568",
    maxWidth: "800px",
    margin: "0 auto"
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px"
  },
  loadingText: {
    color: "#1a365d",
    marginBottom: "2rem"
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "5px solid #f3f3f3",
    borderTop: "5px solid #1a365d",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  emptyState: {
    textAlign: "center",
    padding: "4rem",
    backgroundColor: "#f7fafc",
    borderRadius: "8px",
    color: "#4a5568",
    fontSize: "1.1rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
  },
  storiesContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "3rem"
  },
  // Featured story styles
  featuredStory: {
    display: "flex",
    backgroundColor: "white",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    maxHeight: "400px",
    border: "1px solid #e2e8f0",
    '@media (max-width: 768px)': {
      flexDirection: "column",
      maxHeight: "none",
    }
  },
  featuredContent: {
    flex: "1",
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },
  featuredLabel: {
    display: "inline-block",
    backgroundColor: "#FED102",
    color: "#1a365d",
    padding: "0.25rem 0.75rem",
    borderRadius: "4px",
    fontSize: "0.875rem",
    fontWeight: "600",
    marginBottom: "1rem"
  },
  featuredTitle: {
    fontSize: "2rem",
    color: "#1a365d",
    marginBottom: "0.75rem"
  },
  featuredAuthor: {
    fontSize: "1.1rem",
    color: "#718096",
    fontStyle: "italic",
    marginBottom: "1.5rem"
  },
  featuredPreview: {
    fontSize: "1.1rem",
    color: "#4a5568",
    lineHeight: "1.7",
    marginBottom: "1.5rem"
  },
  readMoreButton: {
    alignSelf: "flex-start",
    backgroundColor: "#1a365d",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s ease"
  },
  featuredImageContainer: {
    flex: "1",
    maxWidth: "50%",
    height: "400px",
    overflow: "hidden",
    '@media (max-width: 768px)': {
      maxWidth: "100%",
      height: "250px",
    }
  },
  featuredImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  // Stories grid styles
  storiesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "2rem",
    '@media (max-width: 768px)': {
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    }
  },
  storyCard: {
    backgroundColor: "white",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    border: "1px solid #e2e8f0",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    '&:hover': {
      transform: "translateY(-5px)",
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
    }
  },
  imageContainer: {
    height: "200px",
    overflow: "hidden"
  },
  storyImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.3s ease"
  },
  storyContent: {
    padding: "1.5rem",
    flex: "1",
    display: "flex",
    flexDirection: "column"
  },
  storyTitle: {
    fontSize: "1.5rem",
    color: "#1a365d",
    marginBottom: "0.5rem"
  },
  storyAuthor: {
    fontSize: "1rem",
    color: "#718096",
    fontStyle: "italic",
    marginBottom: "1rem"
  },
  storyPreview: {
    color: "#4a5568",
    lineHeight: "1.7",
    flex: "1"
  },
  storyFooter: {
    marginTop: "1.5rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  storyDate: {
    fontSize: "0.875rem",
    color: "#a0aec0"
  },
  readButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#e2e8f0",
    color: "#1a365d",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    '&:hover': {
      backgroundColor: "#cbd5e0"
    }
  },
  // Modal styles
  modalBackdrop: {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.75)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: "1000",
    padding: "1rem"
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: "10px",
    maxWidth: "800px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
    position: "relative",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
  },
  closeButton: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    backgroundColor: "white",
    color: "#4a5568",
    border: "none",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    fontSize: "1.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: "10",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  },
  modalImageContainer: {
    width: "100%",
    height: "350px",
    overflow: "hidden"
  },
  modalImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  modalBody: {
    padding: "2rem"
  },
  modalTitle: {
    fontSize: "2rem",
    color: "#1a365d",
    marginBottom: "0.75rem"
  },
  modalAuthor: {
    fontSize: "1.1rem",
    color: "#718096",
    fontStyle: "italic",
    marginBottom: "2rem"
  },
  modalText: {
    color: "#4a5568",
    fontSize: "1.1rem",
    lineHeight: "1.8"
  },
  // CTA Section
  ctaSection: {
    marginTop: "4rem",
    padding: "3rem 2rem",
    backgroundColor: "#f7fafc",
    borderRadius: "10px",
    textAlign: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0"
  },
  ctaTitle: {
    fontSize: "1.8rem",
    color: "#1a365d",
    marginBottom: "1rem"
  },
  ctaText: {
    fontSize: "1.1rem",
    color: "#4a5568",
    maxWidth: "600px",
    margin: "0 auto 1.5rem"
  },
  ctaButton: {
    backgroundColor: "#FED102",
    color: "#1a365d",
    border: "none",
    borderRadius: "6px",
    padding: "0.75rem 1.5rem",
    fontSize: "1.1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    '&:hover': {
      backgroundColor: "#E9C005"
    }
  }
};

export default Stories;
