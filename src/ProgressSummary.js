import React from 'react';

// Helper function to format minutes into hours and minutes string
const formatMinutes = (totalMinutes) => {
    // Ensure input is a non-negative number
    if (typeof totalMinutes !== 'number' || isNaN(totalMinutes) || totalMinutes < 0) {
        return "0m"; // Return 0m for invalid input
    }
    if (totalMinutes === 0) return "0m"; // Explicitly return 0m for zero input

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    let result = '';
    if (hours > 0) {
        result += `${hours}h`; // Add hours part if > 0
    }
    if (minutes > 0) {
        result += `${hours > 0 ? ' ' : ''}${minutes}m`; // Add minutes part if > 0, add space if hours are also present
    }
     // If both hours and minutes were 0 (already handled), or somehow result is empty, return "0m"
    return result || "0m";
};

// Component to display progress statistics
function ProgressSummary({ stats }) {

    // Calculate overall totals only if stats array is valid
    const overallTotal = Array.isArray(stats) ? stats.reduce((sum, item) => sum + (item.totalMinutes || 0), 0) : 0;
    const overallCompleted = Array.isArray(stats) ? stats.reduce((sum, item) => sum + (item.completedMinutes || 0), 0) : 0;
    // Calculate overall percentage, handle division by zero
    const overallPercentage = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

    // Handle case where stats might be undefined, null, or empty array
    if (!stats || !Array.isArray(stats) || stats.length === 0) {
        return (
            <section>
                <h2 style={styles.header}>📊 Progress Summary</h2>
                <p style={styles.noDataText}>Add subjects/papers and generate a schedule to see progress.</p>
            </section>
        );
    }

    return (
        <section>
            <h2 style={styles.header}>📊 Progress Summary</h2>

            {/* Overall Summary Section */}
            <div style={styles.overallSummary}>
                <strong>Overall Progress:</strong> {formatMinutes(overallCompleted)} / {formatMinutes(overallTotal)} completed ({overallPercentage}%)
                {/* Overall Progress Bar */}
                <div style={styles.progressBarContainer}>
                    <div
                        style={{ ...styles.progressBar, width: `${overallPercentage}%` }}
                        role="progressbar"
                        aria-valuenow={overallPercentage}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-label={`Overall progress: ${overallPercentage}%`}
                    >
                    </div>
                </div>
            </div>

            {/* Per Subject/Paper Summary List */}
            <ul style={styles.list}>
                {stats.map((item) => (
                    // Use item.id as key if available and unique, otherwise index
                    <li key={item.id || `${item.subjectName}-${item.paperOrTopic}`} style={styles.listItem}>
                        {/* Subject/Paper Details */}
                        <div style={styles.itemDetails}>
                            <strong>{item.subjectName}</strong> - {item.paperOrTopic}
                        </div>
                        {/* Completion Stats and Mini Progress Bar */}
                        <div style={styles.itemStats}>
                            <span>
                                {formatMinutes(item.completedMinutes)} / {formatMinutes(item.totalMinutes)} ({item.percentage}%)
                            </span>
                             <div style={styles.progressBarContainerSmall}>
                                 <div
                                     style={{ ...styles.progressBarSmall, width: `${item.percentage}%` }}
                                     role="progressbar"
                                     aria-valuenow={item.percentage}
                                     aria-valuemin="0"
                                     aria-valuemax="100"
                                     aria-label={`${item.subjectName} - ${item.paperOrTopic} progress: ${item.percentage}%`}
                                 >
                                 </div>
                             </div>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}

// --- Basic Styling ---
const styles = {
    header: {
        borderBottom: '2px solid #6c757d', // Grey border
        paddingBottom: '0.5rem',
        marginBottom: '1rem',
        color: '#495057'
    },
    overallSummary: {
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        border: '1px solid #dee2e6'
    },
    list: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
    },
    listItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap', // Allow wrapping on smaller screens
        padding: '0.8rem 0.5rem',
        borderBottom: '1px solid #eee',
        gap: '1rem'
    },
    itemDetails: {
        flexGrow: 1, // Allow details to take up space
        marginRight: '1rem', // Ensure space before stats
        minWidth: '150px' // Prevent details from becoming too narrow
    },
    itemStats: {
        textAlign: 'right',
        minWidth: '150px', // Ensure stats area has enough width
        flexShrink: 0 // Prevent stats area from shrinking
    },
    progressBarContainer: {
        height: '10px',
        backgroundColor: '#e9ecef',
        borderRadius: '5px',
        overflow: 'hidden',
        marginTop: '0.5rem'
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#28a745', // Green progress bar
        transition: 'width 0.3s ease-in-out',
        borderRadius: '5px'
    },
     progressBarContainerSmall: {
        height: '6px',
        backgroundColor: '#e9ecef',
        borderRadius: '3px',
        overflow: 'hidden',
        marginTop: '0.3rem',
        width: '100%' // Make small bar take full width of its container
    },
    progressBarSmall: {
        height: '100%',
        backgroundColor: '#17a2b8', // Info blue for item progress
        transition: 'width 0.3s ease-in-out',
        borderRadius: '3px'
    },
    noDataText: {
        fontStyle: 'italic',
        color: '#6c757d'
    }
};

export default ProgressSummary;
