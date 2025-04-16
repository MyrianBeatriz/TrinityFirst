<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, where, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('upcoming'); // 'upcoming' or 'past'

  useEffect(() => {
    // Get current date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0]; // Just the date part
    
    console.log("Today's date for filtering:", todayStr);
    
    let eventsQuery;
    
    if (filterType === 'upcoming') {
      // Get events with date greater than or equal to today
      eventsQuery = query(
        collection(firestore, "events"),
        where("date", ">=", todayStr),
        orderBy("date", "asc")
      );
    } else {
      // Get events with date less than today
      eventsQuery = query(
        collection(firestore, "events"),
        where("date", "<", todayStr),
        orderBy("date", "desc")
      );
    }
    
    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Fetched ${eventsData.length} ${filterType} events`);
      setEvents(eventsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [filterType]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Loading Events...</h1>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Trinity First Events</h1>
        <p style={styles.subtitle}>
          Join us for these events designed to support, connect, and empower 
          first-generation college students at Trinity.
        </p>
      </div>

      <div style={styles.filterContainer}>
        <button 
          onClick={() => setFilterType('upcoming')} 
          style={filterType === 'upcoming' ? styles.activeFilterButton : styles.filterButton}
        >
          Upcoming Events
        </button>
        <button 
          onClick={() => setFilterType('past')} 
          style={filterType === 'past' ? styles.activeFilterButton : styles.filterButton}
        >
          Past Events
        </button>
      </div>

      {events.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No {filterType} events available at this time.</p>
        </div>
      ) : (
        <div style={styles.eventsContainer}>
          {events.map((event) => (
            <div key={event.id} style={styles.eventCard}>
              <div style={styles.eventDate}>
                <div style={styles.dateMonth}>
                  {new Date(event.date).toLocaleString('default', { month: 'short' })}
                </div>
                <div style={styles.dateDay}>
                  {new Date(event.date).getDate()}
                </div>
              </div>
              <div style={styles.eventInfo}>
                <h2 style={styles.eventTitle}>{event.title}</h2>
                <p style={styles.eventDateTime}>
                  {formatDate(event.date)}
                  {event.location && <span> • {event.location}</span>}
                </p>
                <p style={styles.eventDescription}>{event.description}</p>
                {event.registrationLink && filterType === 'upcoming' && (
                  <div style={styles.eventActions}>
                    <a 
                      href={event.registrationLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={styles.registerButton}
                    >
                      Register
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
=======
import React from 'react';

const Events = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1.5rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h1> Upcoming Events</h1>
      <p>Here, users can register for upcoming events related to mentorship and student activities.</p>
>>>>>>> 09f0806cc5ae6a4638843c88a8638f22489dfb17
    </div>
  );
};

<<<<<<< HEAD
// Define styles object
const styles = {
  container: {
    maxWidth: '1000px',
    margin: '2rem auto',
    padding: '0 1.5rem'
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  title: {
    fontSize: '2.5rem',
    color: '#1a365d',
    marginBottom: '1rem'
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#4a5568',
    maxWidth: '700px',
    margin: '0 auto'
  },
  filterContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginBottom: '2rem'
  },
  filterButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#f7fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    color: '#4a5568',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  activeFilterButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#1a365d',
    border: '1px solid #1a365d',
    borderRadius: '6px',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer'
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: '#f7fafc',
    borderRadius: '8px',
    color: '#4a5568',
    fontSize: '1.1rem'
  },
  eventsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  eventCard: {
    display: 'flex',
    backgroundColor: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0'
  },
  eventDate: {
    width: '100px',
    backgroundColor: '#1a365d',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1rem'
  },
  dateMonth: {
    fontSize: '1.2rem',
    fontWeight: '500',
    textTransform: 'uppercase'
  },
  dateDay: {
    fontSize: '2rem',
    fontWeight: '700',
    lineHeight: '1'
  },
  eventInfo: {
    flex: '1',
    padding: '1.5rem'
  },
  eventTitle: {
    fontSize: '1.5rem',
    color: '#1a365d',
    marginBottom: '0.5rem'
  },
  eventDateTime: {
    fontSize: '1rem',
    color: '#718096',
    marginBottom: '1rem'
  },
  eventDescription: {
    color: '#4a5568',
    fontSize: '1rem',
    lineHeight: '1.7',
    maxWidth: '600px'
  },
  eventActions: {
    marginTop: '1.5rem'
  },
  registerButton: {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#FED102',
    color: '#1a365d',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'background-color 0.2s ease'
  }
};

=======
>>>>>>> 09f0806cc5ae6a4638843c88a8638f22489dfb17
export default Events;
