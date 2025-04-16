import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import { collection, getDocs, doc, getDoc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [mentorshipSignups, setMentorshipSignups] = useState([]);
  const [mentorshipMatches, setMentorshipMatches] = useState([]);
  const [events, setEvents] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newEvent, setNewEvent] = useState("");
  const [newStory, setNewStory] = useState({ title: "", content: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🔄 Fetching all users...");
        const usersRef = collection(firestore, "users");
        const usersSnap = await getDocs(usersRef);
        const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log("🔄 Fetching mentorship signups...");
        const signupsRef = collection(firestore, "mentorship_signups");
        const signupsSnap = await getDocs(signupsRef);
        const signupsData = signupsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log("🔄 Fetching AI mentorship matches...");
        const matchesRef = collection(firestore, "mentorship_matches");
        const matchesSnap = await getDocs(matchesRef);
        const matchesData = matchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log("🔄 Fetching events...");
        const eventsRef = collection(firestore, "events");
        const eventsSnap = await getDocs(eventsRef);
        const eventsData = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log("🔄 Fetching student stories...");
        const storiesRef = collection(firestore, "stories");
        const storiesSnap = await getDocs(storiesRef);
        const storiesData = storiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setUsers(usersData);
        setMentorshipSignups(signupsData);
        setMentorshipMatches(matchesData);
        setEvents(eventsData);
        setStories(storiesData);
        setLoading(false);
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const generateMatches = async () => {
    setGenerating(true);
    try {
      console.log("🔄 Generating AI Matches...");
      const response = await fetch("http://127.0.0.1:5000/generate-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const result = await response.json();
      alert(result.message);
    } catch (error) {
      console.error("❌ Error generating matches:", error);
    }
    setGenerating(false);
  };

  const overrideMatch = async (menteeId) => {
    const newMentor = prompt(`Enter a new mentor for mentee ${menteeId}:`);
    if (!newMentor) return;

    try {
      console.log(`🔄 Updating match for mentee ${menteeId}...`);
      const matchRef = doc(firestore, "mentorship_matches", menteeId);
      await updateDoc(matchRef, { mentor: newMentor, adminOverride: true });
      alert("✅ Match updated successfully!");

      setMentorshipMatches(prevMatches =>
        prevMatches.map(match =>
          match.id === menteeId ? { ...match, mentor: newMentor, adminOverride: true } : match
        )
      );
    } catch (error) {
      console.error("❌ Error updating match:", error);
    }
  };

  const addEvent = async () => {
    if (!newEvent) return;
    try {
      await addDoc(collection(firestore, "events"), { title: newEvent });
      alert("✅ Event added successfully!");
      setNewEvent("");
    } catch (error) {
      console.error("❌ Error adding event:", error);
    }
  };

  const addStory = async () => {
    if (!newStory.title || !newStory.content) return;
    try {
      await addDoc(collection(firestore, "stories"), newStory);
      alert("✅ Story added successfully!");
      setNewStory({ title: "", content: "" });
    } catch (error) {
      console.error("❌ Error adding story:", error);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📊 Administrative Portal</h1>

      <button onClick={generateMatches} style={styles.button} disabled={generating}>
        {generating ? "Generating Matches..." : "Generate AI Matches"}
      </button>

      <h2>👥 All Users</h2>
      <ul>{users.map(user => <li key={user.id}>{user.firstName} {user.lastName} - {user.email}</li>)}</ul>

      <h2>📋 Mentorship Signups</h2>
      <ul>{mentorshipSignups.map(user => <li key={user.id}>{user.name} - {user.email}</li>)}</ul>

      <h2>🤖 AI-Generated Mentorship Matches</h2>
      <ul>
        {mentorshipMatches.map(match => (
          <li key={match.id}>
            {match.mentee} → {match.mentor} (Score: {match.compatibilityScore})
            <button onClick={() => overrideMatch(match.id)} style={styles.button}>Change Mentor</button>
          </li>
        ))}
      </ul>

      <h2>📅 Add Event</h2>
      <input type="text" value={newEvent} onChange={(e) => setNewEvent(e.target.value)} />
      <button onClick={addEvent} style={styles.button}>Add Event</button>

      <h2>📖 Manage Stories</h2>
      <input type="text" placeholder="Title" value={newStory.title} onChange={(e) => setNewStory({ ...newStory, title: e.target.value })} />
      <textarea placeholder="Story Content" value={newStory.content} onChange={(e) => setNewStory({ ...newStory, content: e.target.value })} />
      <button onClick={addStory} style={styles.button}>Add Story</button>
    </div>
  );
};

const styles = { container: { maxWidth: "900px", margin: "2rem auto", padding: "2rem", textAlign: "center" }, button: { margin: "10px", padding: "8px", borderRadius: "6px", cursor: "pointer" } };

export default AdminDashboard;

