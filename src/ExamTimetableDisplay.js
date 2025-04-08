import React, { useState, useEffect, useMemo } from 'react';

// Helper function to format date string nicely (e.g., "Monday, 14 Apr 2025") for display
// (Copied from ScheduleDisplay - consider moving to a shared utils file in a larger app)
const formatDisplayDate = (dateISO) => {
    try {
        const date = new Date(dateISO + 'T00:00:00'); // Treat as local date
         if (isNaN(date)) return dateISO; // Return original string if invalid
         return date.toLocaleDateString('en-GB', { // British English format
             weekday: 'long',
             year: 'numeric',
             month: 'long', // Use 'long' for full month name
             day: 'numeric'
         });
    } catch {
         return dateISO; // Fallback
    }
};


// Component to display the detailed exam timetable with day navigation
function ExamTimetableDisplay({ timetable }) { // Renamed prop for clarity internally

    // --- State for Navigation ---
    const [currentIndex, setCurrentIndex] = useState(0);

    // --- Calculate sorted unique dates with exams ---
    const sortedUniqueExamDates = useMemo(() => {
        if (!timetable || !Array.isArray(timetable) || timetable.length === 0) {
            return [];
        }
        // Get unique dates from the timetable data (using dateISO)
        const uniqueDates = [...new Set(timetable.map(item => item.dateISO))];
        // Sort the unique dates chronologically
        return uniqueDates.sort();
    }, [timetable]); // Recalculate only if timetable data changes

    // --- Effect to reset index when timetable data changes ---
    useEffect(() => {
        setCurrentIndex(0); // Reset to the first day when timetable data changes
    }, [sortedUniqueExamDates]); // Dependency array

    // --- Navigation Handlers ---
    const handlePreviousDay = () => {
        setCurrentIndex(prevIndex => Math.max(0, prevIndex - 1));
    };

    const handleNextDay = () => {
        setCurrentIndex(prevIndex => Math.min(sortedUniqueExamDates.length - 1, prevIndex + 1));
    };

    // --- Filtering for Current Day's Exams ---
    const currentDate = sortedUniqueExamDates[currentIndex];
    // Filter the main timetable to get only exams for the current date
    const examsForCurrentDay = useMemo(() => {
        if (!currentDate) return [];
        return timetable.filter(item => item.dateISO === currentDate);
    }, [timetable, currentDate]);


    // --- Render Logic ---

    // Handle case where no timetable data is available
    if (sortedUniqueExamDates.length === 0) {
        return (
             <section>
                <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Exam Timetable Details</h2>
                <p>No detailed exam timetable data available to display.</p>
             </section>
        );
    }

    // Render the main display with navigation
    return (
        <section>
            <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Exam Timetable Details</h2>

             {/* --- Day Navigation --- */}
            <div style={styles.navigationContainer}>
                <button
                    onClick={handlePreviousDay}
                    disabled={currentIndex === 0}
                    style={currentIndex === 0 ? styles.navButtonDisabled : styles.navButton}
                    aria-label="Previous Day with Exams"
                >
                    &lt; Prev Day
                </button>
                <h3 style={styles.currentDateHeader}>
                    {/* Display the formatted current date */}
                    {formatDisplayDate(currentDate)}
                </h3>
                <button
                    onClick={handleNextDay}
                    disabled={currentIndex === sortedUniqueExamDates.length - 1}
                    style={currentIndex === sortedUniqueExamDates.length - 1 ? styles.navButtonDisabled : styles.navButton}
                    aria-label="Next Day with Exams"
                >
                    Next Day &gt;
                </button>
            </div>


            {/* --- Exam Table for the Current Day --- */}
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Subject</th>
                            <th style={styles.th}>Paper</th>
                            <th style={styles.th}>Start</th>
                            <th style={styles.th}>Finish</th>
                            <th style={styles.th}>Duration</th>
                            <th style={styles.th}>Location</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Map over the exams filtered for the current day */}
                        {examsForCurrentDay.length > 0 ? (
                            examsForCurrentDay.map((item, index) => (
                                <tr key={index} style={index % 2 === 0 ? styles.trEven : styles.trOdd}>
                                    {/* Don't need date column as it's in the header now */}
                                    <td style={styles.td}>{item.subject || '-'}</td>
                                    <td style={styles.td}>{item.paper || '-'}</td>
                                    <td style={styles.td}>{item.startTime || '-'}</td>
                                    <td style={styles.td}>{item.finishTime || '-'}</td>
                                    <td style={styles.td}>{item.duration || '-'}</td>
                                    <td style={styles.td}>{item.location || '-'}</td>
                                </tr>
                            ))
                        ) : (
                            // Display a message if no exams are scheduled for the selected date
                            // This shouldn't happen if sortedUniqueExamDates is derived correctly, but good fallback
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', fontStyle: 'italic', padding: '1rem' }}>
                                    No exams scheduled for this specific day.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

// --- Basic Styling (Includes styles from previous version + navigation) ---
const styles = {
    navigationContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 0',
        marginBottom: '1rem',
        borderBottom: '1px solid #eee'
    },
    navButton: {
        padding: '0.5rem 1rem',
        cursor: 'pointer',
        backgroundColor: '#007bff', // Blue for navigation
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '0.9rem',
        transition: 'background-color 0.2s ease'
    },
    navButtonDisabled: {
        padding: '0.5rem 1rem',
        cursor: 'not-allowed',
        backgroundColor: '#cccccc', // Grey when disabled
        color: '#666666',
        border: 'none',
        borderRadius: '4px',
        fontSize: '0.9rem',
        opacity: 0.7
    },
    currentDateHeader: {
        margin: 0, // Remove default margin
        fontSize: '1.2em',
        fontWeight: 'bold',
        textAlign: 'center',
        flexGrow: 1, // Allow date to take space
        padding: '0 1rem' // Add padding around date
    },
    table: {
        borderCollapse: 'collapse',
        width: '100%',
        fontSize: '0.9rem',
        marginTop: '1rem'
    },
    th: {
        border: '1px solid #ccc',
        padding: '0.8rem',
        backgroundColor: '#e9ecef',
        textAlign: 'left',
        fontWeight: 'bold'
    },
    td: {
        border: '1px solid #ccc',
        padding: '0.8rem',
        textAlign: 'left'
    },
    trOdd: {
        backgroundColor: '#f8f9fa'
    },
    trEven: {
        backgroundColor: '#ffffff'
    }
};

export default ExamTimetableDisplay;


