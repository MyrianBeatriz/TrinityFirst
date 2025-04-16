import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredResources, setFeaturedResources] = useState([]);

  // Resource categories for filtering
  const resourceCategories = [
    { value: "all", label: "All Resources" },
    { value: "scholarship", label: "Scholarships" },
    { value: "internship", label: "Internships" },
    { value: "job", label: "Job Opportunities" },
    { value: "academic", label: "Academic Resources" },
    { value: "financial", label: "Financial Aid" },
    { value: "campus", label: "Campus Resources" },
    { value: "community", label: "Community Resources" },
    { value: "other", label: "Other" }
  ];

  // Fetch resources from Firestore
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const resourcesRef = collection(firestore, "resources");
        const resourcesQuery = query(resourcesRef, orderBy("publishDate", "desc"));
        const resourcesSnap = await getDocs(resourcesQuery);
        
        const resourcesData = resourcesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Separate featured resources from regular resources
        const featured = resourcesData.filter(resource => resource.featured);
        
        setResources(resourcesData);
        setFeaturedResources(featured);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching resources:", error);
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  // Filter resources based on selected category and search query
  const getFilteredResources = () => {
    return resources.filter(resource => {
      // Category filter
      const categoryMatch = selectedCategory === "all" || resource.category === selectedCategory;
      
      // Search query filter
      const searchMatch = !searchQuery || 
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (resource.createdBy && resource.createdBy.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return categoryMatch && searchMatch;
    });
  };

  // Render a resource card
  const ResourceCard = ({ resource }) => (
    <div style={styles.resourceCard}>
      <div style={styles.resourceHeader}>
        <h3 style={styles.resourceTitle}>{resource.title}</h3>
        {resource.featured && <span style={styles.featuredBadge}>Featured</span>}
      </div>
      
      <div style={styles.resourceMeta}>
        <span style={{
          ...styles.categoryBadge,
          backgroundColor: 
            resource.category === 'scholarship' ? '#ebf8ff' :
            resource.category === 'internship' ? '#e6fffa' :
            resource.category === 'job' ? '#faf5ff' :
            resource.category === 'academic' ? '#f0fff4' :
            resource.category === 'financial' ? '#fffaf0' :
            resource.category === 'campus' ? '#fff5f7' :
            resource.category === 'community' ? '#f7fafc' : '#f7fafc',
          color:
            resource.category === 'scholarship' ? '#2b6cb0' :
            resource.category === 'internship' ? '#2c7a7b' :
            resource.category === 'job' ? '#6b46c1' :
            resource.category === 'academic' ? '#2f855a' :
            resource.category === 'financial' ? '#c05621' :
            resource.category === 'campus' ? '#b83280' :
            resource.category === 'community' ? '#4a5568' : '#4a5568'
        }}>
          {resourceCategories.find(cat => cat.value === resource.category)?.label.slice(0, -1) || "Other"}
        </span>
        
        <span style={styles.resourceDate}>
          Added: {new Date(resource.publishDate).toLocaleDateString()}
        </span>
      </div>
      
      {resource.createdBy && (
        <p style={styles.createdByText}>
          Created by: {resource.createdBy}
        </p>
      )}
      
      <p style={styles.resourceDescription}>
        {resource.description}
      </p>
      
      <div style={styles.resourceActions}>
        <a 
          href={resource.link} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={styles.resourceLink}
        >
          Access Resource →
        </a>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.headerSection}>
        <h1 style={styles.pageTitle}>First-Gen Resources</h1>
        <p style={styles.pageDescription}>
          Explore resources created by and for first-generation college students to support your academic journey.
        </p>
      </div>
      
      {/* Featured Resources Section */}
      {featuredResources.length > 0 && (
        <div style={styles.featuredSection}>
          <h2 style={styles.sectionTitle}>Featured Resources</h2>
          <div style={styles.featuredGrid}>
            {featuredResources.map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </div>
      )}
      
      {/* Filter and Search Section */}
      <div style={styles.filtersSection}>
        <div style={styles.searchBar}>
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        
        <div style={styles.categoryFilters}>
          {resourceCategories.map(category => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              style={{
                ...styles.categoryButton,
                backgroundColor: selectedCategory === category.value ? '#1a365d' : 'transparent',
                color: selectedCategory === category.value ? 'white' : '#4a5568'
              }}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Resources Section */}
      <div style={styles.resourcesSection}>
        <h2 style={styles.sectionTitle}>
          {selectedCategory === "all" 
            ? "All Resources" 
            : resourceCategories.find(cat => cat.value === selectedCategory)?.label || "Resources"}
        </h2>
        
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p>Loading resources...</p>
          </div>
        ) : getFilteredResources().length > 0 ? (
          <div style={styles.resourcesGrid}>
            {getFilteredResources().map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <p>No resources found for the selected filters.</p>
            <button 
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }} 
              style={styles.resetButton}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem 1rem",
  },
  headerSection: {
    textAlign: "center",
    marginBottom: "2rem",
    paddingBottom: "1.5rem",
    borderBottom: "1px solid #e2e8f0",
  },
  pageTitle: {
    fontSize: "2.25rem",
    color: "#1a365d",
    marginBottom: "0.5rem",
    fontWeight: "700",
  },
  pageDescription: {
    fontSize: "1.1rem",
    color: "#4a5568",
    maxWidth: "800px",
    margin: "0 auto",
  },
  featuredSection: {
    marginBottom: "3rem",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    color: "#1a365d",
    marginBottom: "1.25rem",
    fontWeight: "600",
  },
  featuredGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.5rem",
  },
  filtersSection: {
    marginBottom: "2rem",
  },
  searchBar: {
    marginBottom: "1rem",
  },
  searchInput: {
    width: "100%",
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  categoryFilters: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginBottom: "1.5rem",
  },
  categoryButton: {
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    backgroundColor: "transparent",
    color: "#4a5568",
    cursor: "pointer",
    transition: "all 0.2s",
    fontSize: "0.9rem",
  },
  resourcesSection: {
    marginBottom: "3rem",
  },
  resourcesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.5rem",
  },
  resourceCard: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    padding: "1.5rem",
    transition: "all 0.2s",
    border: "1px solid #e2e8f0",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  resourceHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "0.75rem",
  },
  resourceTitle: {
    fontSize: "1.25rem",
    color: "#1a365d",
    margin: "0",
    fontWeight: "600",
    flexGrow: 1,
  },
  featuredBadge: {
    backgroundColor: "#9f7aea",
    color: "white",
    padding: "0.25rem 0.5rem",
    borderRadius: "9999px",
    fontSize: "0.7rem",
    fontWeight: "600",
    marginLeft: "0.5rem",
    flexShrink: 0,
  },
  resourceMeta: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    marginBottom: "0.75rem",
    flexWrap: "wrap",
  },
  categoryBadge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "6px",
    fontSize: "0.75rem",
    fontWeight: "600",
  },
  resourceDate: {
    fontSize: "0.875rem",
    color: "#718096",
  },
  createdByText: {
    fontSize: "0.875rem",
    fontStyle: "italic",
    color: "#4a5568",
    margin: "0 0 0.75rem 0",
  },
  resourceDescription: {
    fontSize: "0.95rem",
    color: "#4a5568",
    lineHeight: "1.5",
    marginBottom: "1.5rem",
    flexGrow: 1,
  },
  resourceActions: {
    marginTop: "auto",
  },
  resourceLink: {
    display: "inline-block",
    backgroundColor: "#1a365d",
    color: "white",
    padding: "0.6rem 1.2rem",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "0.95rem",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem 0",
  },
  loadingSpinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e2e8f0",
    borderTopColor: "#2b6cb0",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "1rem",
  },
  emptyState: {
    textAlign: "center",
    padding: "3rem 0",
    color: "#718096",
  },
  resetButton: {
    backgroundColor: "#4299e1",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "0.75rem 1.5rem",
    marginTop: "1rem",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "500",
  },
};

export default Resources;
