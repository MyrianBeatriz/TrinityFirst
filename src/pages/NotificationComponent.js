import React, { useState, useEffect } from "react";

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    // Auto-dismiss notification after 5 seconds
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    notification: {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "12px 20px",
      borderRadius: "6px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      minWidth: "300px",
      backgroundColor: type === "success" ? "#c6f6d5" :
                       type === "error" ? "#fed7d7" :
                       type === "warning" ? "#fefcbf" : "#bee3f8",
      color: type === "success" ? "#2f855a" :
             type === "error" ? "#c53030" :
             type === "warning" ? "#744210" : "#2b6cb0",
      borderLeft: `4px solid ${
        type === "success" ? "#48bb78" :
        type === "error" ? "#f56565" :
        type === "warning" ? "#ecc94b" : "#4299e1"
      }`
    },
    closeButton: {
      background: "none",
      border: "none",
      fontSize: "16px",
      cursor: "pointer",
      marginLeft: "10px",
      color: "inherit"
    }
  };

  return (
    <div style={styles.notification}>
      <div>{message}</div>
      <button style={styles.closeButton} onClick={onClose}>×</button>
    </div>
  );
};

export default Notification;
