import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

// This is a debugging component to troubleshoot resource display issues
const ResourceDebug = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        console.log("Debug: Fetching resources...");
        
        const resourcesRef = collection(firestore, "resources");
        const resourcesQuery = query(resourcesRef, orderBy("publishDate", "desc"));
        const resourcesSnap = await getDocs(resourcesQuery);
        
        console.log(`Debug: Found ${resourcesSnap.docs.length} resources`);
        
        const resourcesData = resourcesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log("Debug: All resources:", resourcesData);
        setResources(resourcesData);
        setLoading(false);
      } catch (err) {
        console.error("Debug: Error fetching resources:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  if (loading) {
    return <div>Loading resources data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Resource Debug Panel</h2>
      <p>Found {resources.length} resources in the database.</p>
      
      {resources.length > 0 ? (
        <div>
          <h3>Resources Data:</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f2f2f2" }}>
                  <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>ID</th>
                  <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Title</th>
                  <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Category</th>
                  <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Featured</th>
                  <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Created By</th>
                  <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Publish Date</th>
                </tr>
              </thead>
              <tbody>
                {resources.map(resource => (
                  <tr key={resource.id}>
                    <td style={{ padding: "10px", border: "1px solid #ddd" }}>{resource.id}</td>
                    <td style={{ padding: "10px", border: "1px solid #ddd" }}>{resource.title || "Missing title"}</td>
                    <td style={{ padding: "10px", border: "1px solid #ddd" }}>{resource.category || "Missing category"}</td>
                    <td style={{ padding: "10px", border: "1px solid #ddd" }}>{resource.featured ? "Yes" : "No"}</td>
                    <td style={{ padding: "10px", border: "1px solid #ddd" }}>{resource.createdBy || "Anonymous"}</td>
                    <td style={{ padding: "10px", border: "1px solid #ddd" }}>{resource.publishDate || "No date"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p>No resources found. Try adding a resource from the admin dashboard.</p>
      )}
    </div>
  );
};

export default ResourceDebug;