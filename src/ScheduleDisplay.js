import React, { useState, useEffect, useMemo } from 'react';

// --- Helper Functions ---

// Format date string (e.g., "Monday, 14 Apr 2025")
const formatDisplayDate = (dateISO) => {
    // Basic check for valid YYYY-MM-DD format
    if (!dateISO || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
        return dateISO || "Invalid Date"; // Return original or error message
    }
    try {
        // Create date object ensuring it's treated as local timezone start of day
        const date = new Date(dateISO + 'T00:00:00');
         if (isNaN(date)) return dateISO; // Return original string if invalid
         // Format using British English locale
         return date.toLocaleDateString('en-GB', {
             weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
         });
    } catch {
         return dateISO; // Fallback
    }
};

// Convert HH:MM time string to minutes since midnight
// Returns NaN for invalid formats or "Various"
const timeToMinutes = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return NaN; // Return NaN for invalid input
    const lowerTime = timeString.toLowerCase();
    // Treat "Various" as invalid for minute conversion
    if (lowerTime === 'various') return NaN;

    // Match HH:MM format
    const match = lowerTime.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return NaN; // If not HH:MM format, return NaN

    try {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        // Basic validation for hours/minutes range
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            return NaN;
        }
        return hours * 60 + minutes;
    } catch {
        return NaN; // Return NaN on error
    }
};


// Convert HH:MM or "Various" time to a sortable number (minutes from midnight)
// Uses the timeToMinutes helper defined above
const timeToSortableValue = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return Infinity; // Place invalid/missing times last
    const lowerTime = timeString.toLowerCase();
    if (lowerTime === 'various') return -1; // Place "Various" first
    const minutes = timeToMinutes(timeString); // Use the helper
    // Return minutes if valid, otherwise Infinity to sort last
    return isNaN(minutes) ? Infinity : minutes;
};


// Calculate duration between two HH:MM times in minutes (used for exam duration display)
// Uses the timeToMinutes helper defined above
const calculateDuration = (startTime, endTime) => {
    const startMinutes = timeToMinutes(startTime); // Usage was correct here
    const endMinutes = timeToMinutes(endTime);   // Usage was correct here
    // Check if conversion was successful and end is after start
    if (isNaN(startMinutes) || isNaN(endMinutes) || endMinutes <= startMinutes) {
        return 0;
    }
    return endMinutes - startMinutes;
};

// Helper to format Date object as YYYY-MM-DD (needed for export function DTSTAMP)
const formatDateISO = (date) => {
    // Ensure date is a valid Date object
    if (!(date instanceof Date) || isNaN(date)) {
        // console.warn("Invalid date passed to formatDateISO:", date); // Reduce noise
        return null; // Return null for invalid dates
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper: Format Date/Time for iCal (YYYYMMDDTHHMMSS)
// Assumes local time, does not include timezone info explicitly
const formatIcsDateTime = (dateISO, timeHHMM) => {
    // Validate inputs
    if (!dateISO || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO) || !timeHHMM || timeHHMM.toLowerCase() === 'various') {
        return null; // Cannot format without specific date/time
    }
    // Basic check for HH:MM format
    if (!/^\d{1,2}:\d{2}$/.test(timeHHMM)) {
        return null;
    }
    // Remove separators from date and time
    const datePart = dateISO.replace(/-/g, '');
    const timePart = timeHHMM.replace(/:/g, '') + '00'; // Add seconds
    return `${datePart}T${timePart}`;
};

// Helper: Generate Unique ID for iCal events
const generateUid = () => {
    // Simple UID generator based on timestamp and random number
    return 'uid-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
};


// --- Component to display items for a SINGLE day (with Checkbox) ---
// Accepts scheduleItemsForDay, completionStatus, onToggleCompletion props
const DayScheduleView = ({ scheduleItemsForDay, completionStatus, onToggleCompletion }) => {
     // Display message if no items for the selected day
     if (!scheduleItemsForDay || scheduleItemsForDay.length === 0) {
        return <p style={styles.noItemsText}>No revision or exams scheduled for this day.</p>;
    }
    // Render list of items
    return (
        <ul style={{ listStyleType: 'none', padding: 0, marginTop: '1rem' }}>
            {/* Map over items for the day */}
            {scheduleItemsForDay.map((item, index) => {
                // Generate a unique ID for this specific schedule item instance
                // Using date, start time, and task should be reasonably unique for tracking completion
                const itemId = `${item.date}_${item.startTime}_${item.task}`;
                const isCompleted = !!completionStatus[itemId]; // Check if this item ID is marked completed

                return (
                    // Apply completed style if necessary
                    // Use itemId as key for better stability if list order changes slightly
                    <li key={itemId} style={{ ...styles.scheduleItem(item.displayType, item.rag), ...(isCompleted && styles.completedItem) }}>
                        {/* Add Checkbox container for study items */}
                        <div style={styles.checkboxContainer}>
                            {item.displayType === 'study' && (
                                <input
                                    type="checkbox"
                                    checked={isCompleted}
                                    onChange={() => onToggleCompletion(itemId)} // Call handler with itemId
                                    aria-label={`Mark ${item.task} as complete`}
                                    style={styles.checkbox}
                                />
                            )}
                        </div>
                        {/* Time Column */}
                        <span style={styles.timeSpan}>
                            {/* Display time differently for exams vs revision/breaks */}
                            {item.displayType === 'exam'
                                ? `${item.startTime}${item.endTime ? ` - ${item.endTime}` : ''}`
                                : `${item.startTime} - ${item.endTime}`
                            }
                        </span>
                        {/* Task/Details Column */}
                        <span style={styles.taskSpan}>
                            {/* Add prefix for exams */}
                            {item.displayType === 'exam' && <strong style={styles.examLabel}>[EXAM] </strong>}
                            {/* Main task name */}
                            {item.task}
                            {/* RAG indicator for study items */}
                            {item.displayType === 'study' && (<span style={styles.ragIndicator(item.rag)}>({item.rag?.toUpperCase()})</span>)}
                            {/* Additional exam details */}
                            {item.displayType === 'exam' && item.paper && ` (${item.paper})`}
                            {item.displayType === 'exam' && item.location && ` - ${item.location}`}
                        </span>
                        {/* Duration Column */}
                        <span style={styles.durationSpan}>
                            {/* Display duration differently for exams vs revision/breaks */}
                            {item.displayType !== 'exam'
                                ? `(${item.duration} mins)`
                                : item.duration ? `(${item.duration})` : '' // Show original string or nothing for exams
                            }
                        </span>
                    </li>
                );
            })}
        </ul>
    );
};


// --- Main Schedule Display Component (Handles navigation, data merging, exports) ---
// Accepts generatedSchedule, warnings, plannerEntries, completionStatus, onToggleCompletion props
function ScheduleDisplay({ generatedSchedule, warnings, plannerEntries, completionStatus, onToggleCompletion }) {

    // State for the index of the currently viewed date
    const [currentIndex, setCurrentIndex] = useState(0);

    // --- Combine generated schedule and relevant exams from plannerEntries ---
    // useMemo ensures this complex calculation only runs when inputs change
    const combinedSchedule = useMemo(() => {
        // Map revision/break items from generatedSchedule
        const revisionItems = (generatedSchedule || []).map(item => ({
            ...item, // Spread existing properties (date, startTime, endTime, task, type, rag, duration, sortTime)
            displayType: item.type, // 'study' or 'break'
            // Ensure sortTime exists (use value from generator or calculate if missing)
            sortTime: item.sortTime !== undefined ? item.sortTime : timeToSortableValue(item.startTime)
        }));

        // Map relevant exam items from plannerEntries
        const examItems = (plannerEntries || [])
            .filter(entry => entry.examDetails && entry.examDetails.date) // Ensure it has exam details with a date
            .map(entry => {
                // Calculate day of week from ISO date string
                let dayOfWeek = 'Unknown';
                try { const dateObj = new Date(entry.examDetails.date + 'T00:00:00'); if (!isNaN(dateObj)) dayOfWeek = dateObj.toLocaleDateString('en-GB', { weekday: 'long'}); } catch {}
                // Calculate duration in minutes if possible, otherwise use original string or '-'
                const examDurationMins = calculateDuration(entry.examDetails.startTime, entry.examDetails.finishTime);
                const durationString = entry.examDetails.duration || (examDurationMins > 0 ? `${examDurationMins} mins` : '-'); // Use original duration string or calculated mins

                return {
                    date: entry.examDetails.date, // ISO date string (YYYY-MM-DD)
                    dayOfWeek: dayOfWeek,
                    startTime: entry.examDetails.startTime || 'N/A', // HH:MM or N/A
                    endTime: entry.examDetails.finishTime || 'N/A', // HH:MM or N/A (used for display and iCal)
                    task: `${entry.subjectName} - ${entry.paperOrTopic}`, // Combine subject and paper/topic
                    type: 'exam', // Original type identifier
                    displayType: 'exam', // Type for styling/display logic
                    rag: null, // Exams don't have RAG
                    duration: durationString, // Use formatted duration string
                    paper: entry.paperOrTopic, // Specific paper/topic name
                    location: entry.examDetails.location || 'N/A', // Location or N/A
                    sortTime: timeToSortableValue(entry.examDetails.startTime) // Sort based on start time
                };
            });

        // Return the combined list of all items
        return [...revisionItems, ...examItems];

    }, [generatedSchedule, plannerEntries]); // Recalculate when generatedSchedule or plannerEntries changes

    // --- Calculate sorted unique dates from the combined list ---
    const sortedUniqueDates = useMemo(() => {
        if (combinedSchedule.length === 0) return [];
        // Create a Set of unique dates, filter out any potential null/undefined values, then sort
        const uniqueDates = [...new Set(combinedSchedule.map(item => item.date))].filter(Boolean);
        return uniqueDates.sort(); // Sort YYYY-MM-DD strings chronologically
    }, [combinedSchedule]);

    // --- Effect to reset index when the data/dates change ---
    useEffect(() => {
        setCurrentIndex(0); // Reset to the first day when the schedule data changes
    }, [sortedUniqueDates]); // Dependency: run when the array of sorted unique dates changes

    // --- Navigation Handlers ---
    const handlePreviousDay = () => {
        setCurrentIndex(prevIndex => Math.max(0, prevIndex - 1)); // Prevent going below index 0
    };
    const handleNextDay = () => {
        setCurrentIndex(prevIndex => Math.min(sortedUniqueDates.length - 1, prevIndex + 1)); // Prevent going beyond last index
    };

    // --- Filtering and Sorting for Current Day ---
    // Get the date string for the current index
    const currentDate = sortedUniqueDates[currentIndex];
    // Filter the combined schedule for the current date and sort items by time
    const scheduleForCurrentDay = useMemo(() => {
        if (!currentDate) return []; // Return empty array if no current date
        return combinedSchedule
            .filter(item => item.date === currentDate) // Get items for this date
            .sort((a, b) => a.sortTime - b.sortTime); // Sort by pre-calculated sortTime (minutes)
    }, [combinedSchedule, currentDate]);


    // --- Export Functions ---
    const exportToIcs = () => {
        if (combinedSchedule.length === 0) { alert("No schedule items to export."); return; }
        // Start iCal file content
        let icsString = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//YourAppName//IGCSE Revision Planner//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n`;
        // Sort all items chronologically for the file export
        const sortedFullSchedule = [...combinedSchedule].sort((a, b) => { if (a.date !== b.date) return a.date.localeCompare(b.date); return a.sortTime - b.sortTime; });

        sortedFullSchedule.forEach(item => {
            // Format start and end times for iCal standard (YYYYMMDDTHHMMSS)
            const dtStart = formatIcsDateTime(item.date, item.startTime);
            // Use item.endTime (holds finishTime for exams, calculated endTime for study/breaks)
            const dtEnd = formatIcsDateTime(item.date, item.endTime);
            // Skip items with invalid date/time for iCal
            if (!dtStart || !dtEnd) return;

            let summary = ''; let description = '';
            // Create summary and description based on item type
            if (item.displayType === 'study') { summary = `Revise: ${item.task}`; description = `Subject/Topic: ${item.task}\\nConfidence: ${item.rag?.toUpperCase() || 'N/A'}\\nDuration: ${item.duration} mins`; }
            else if (item.displayType === 'break') { summary = item.task; description = `Duration: ${item.duration} mins`; } // Use task ('Break' or 'Fixed Break')
            else if (item.displayType === 'exam') { summary = `EXAM: ${item.task}`; description = `Paper: ${item.paper || 'N/A'}\\nLocation: ${item.location || 'N/A'}\\nDuration: ${item.duration || 'N/A'}`; }

            // Get current timestamp for DTSTAMP
            const now = new Date();
            const dtStamp = formatIcsDateTime(formatDateISO(now), now.toTimeString().substring(0, 5));

            // Helper to escape special characters in iCal text fields
            const escapeIcsText = (text) => text ? text.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/\n/g, '\\n').replace(/;/g, '\\;') : '';

            // Append VEVENT block to the iCal string
            icsString += `BEGIN:VEVENT\n`;
            icsString += `UID:${generateUid()}\n`; // Unique ID for the event
            icsString += `DTSTAMP:${dtStamp || ''}\n`; // Timestamp of creation
            icsString += `DTSTART:${dtStart}\n`; // Start date/time
            icsString += `DTEND:${dtEnd}\n`; // End date/time
            icsString += `SUMMARY:${escapeIcsText(summary)}\n`; // Event title
            icsString += `DESCRIPTION:${escapeIcsText(description)}\n`; // Event description
            // Add location only for exams
            if (item.location && item.displayType === 'exam') { icsString += `LOCATION:${escapeIcsText(item.location)}\n`; }
            icsString += `END:VEVENT\n`;
        });

        // End VCALENDAR block
        icsString += `END:VCALENDAR`;

        // Create a downloadable Blob
        const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "revision_schedule.ics"); // Filename for download
        document.body.appendChild(link); // Append link to body
        link.click(); // Programmatically click the link to trigger download
        document.body.removeChild(link); // Remove the link
    };

    const exportToPdfList = () => {
         if (combinedSchedule.length === 0) { alert("No schedule items to export."); return; }
        // Sort all items chronologically for the printable list
        const sortedFullSchedule = [...combinedSchedule].sort((a, b) => { if (a.date !== b.date) return a.date.localeCompare(b.date); return a.sortTime - b.sortTime; });

        // Generate HTML Table String for the new window/tab
        let htmlString = ` <!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <title>Revision Schedule</title> <style> body { font-family: Arial, sans-serif; margin: 20px; } table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10pt; } th, td { border: 1px solid #ccc; padding: 6px; text-align: left; word-break: break-word; } th { background-color: #f2f2f2; font-weight: bold; } tr:nth-child(even) { background-color: #f9f9f9; } h1 { text-align: center; font-size: 16pt; margin-bottom: 20px; } .exam { background-color: #e6f7ff; font-weight: bold; } .break { background-color: #f8f9fa; font-style: italic; } .study-red { border-left: 3px solid #dc3545; padding-left: 5px;} .study-amber { border-left: 3px solid #ffc107; padding-left: 5px;} .study-green { border-left: 3px solid #28a745; padding-left: 5px;} </style> </head> <body> <h1>Revision Schedule</h1> <table> <thead> <tr> <th>Date</th> <th>Day</th> <th>Start</th> <th>End</th> <th>Type</th> <th>Details</th> <th>Duration</th> <th>Location</th> </tr> </thead> <tbody> `;

        // Populate table rows
        sortedFullSchedule.forEach(item => {
            let typeText = ''; let details = item.task; let rowClass = ''; let location = item.location || ''; let durationText = item.duration || '-';
            if (item.displayType === 'study') { typeText = 'Revision'; details += ` (${item.rag?.toUpperCase()})`; rowClass = `study-${item.rag}`; durationText = item.duration ? `${item.duration} mins` : '-'; }
            else if (item.displayType === 'break') { typeText = item.task; details = '-'; rowClass = 'break'; durationText = item.duration ? `${item.duration} mins` : '-'; } // Use task ('Break' or 'Fixed Break')
            else if (item.displayType === 'exam') { typeText = 'EXAM'; details = `${item.task}${item.paper ? ` (${item.paper})` : ''}`; rowClass = 'exam'; durationText = item.duration || '-'; }
            else { typeText = item.type || 'Misc'; } // Fallback type

            htmlString += ` <tr class="${rowClass}"> <td>${item.date}</td> <td>${item.dayOfWeek}</td> <td>${item.startTime}</td> <td>${item.endTime || '-'}</td> <td>${typeText}</td> <td>${details}</td> <td>${durationText}</td> <td>${location}</td> </tr> `;
        });

        htmlString += ` </tbody> </table> </body> </html> `;

        // Open the generated HTML in a new browser window/tab
        const win = window.open("", "_blank");
        if (win) {
            win.document.write(htmlString);
            win.document.close(); // Close the document stream
            // Add a slight delay before alerting the user, allowing content to render
            setTimeout(() => {
                 win.alert("Your printable schedule is ready in this new tab.\nUse your browser's Print function (Ctrl+P or Cmd+P) and select 'Save as PDF'.");
             }, 500);
        } else {
            // Alert user if popup was blocked
            alert("Could not open new window. Please check your browser's popup blocker settings.");
        }
    };


    // --- Render Logic ---
     // Handle case where no dates with items exist
     if (sortedUniqueDates.length === 0) {
        // Still display warnings if they exist
        if (warnings && warnings.length > 0) {
             return (
                 <section>
                    <h2 style={styles.mainHeader}>📅 Generated Schedule Results</h2>
                    <div style={styles.warningBox}>
                        <strong>Heads up!</strong>
                        <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
                            {warnings.map((warning, index) => <li key={index}>{warning}</li>)}
                        </ul>
                    </div>
                    <p style={styles.infoText}>No schedule items or exams found for the selected subjects and date range.</p>
                 </section>
             );
        }
        // If no schedule/exams and no warnings
        return <p style={styles.infoText}>No schedule generated. Please check inputs and click 'Generate'.</p>;
    }

    // Render the main display with navigation and daily schedule
    return (
        <section>
            <h2 style={styles.mainHeader}>📅 Your Generated Revision Schedule</h2>
            {/* Display Warnings if any exist */}
            {warnings && warnings.length > 0 && (
                 <div style={styles.warningBox}>
                    <strong>Heads up!</strong>
                    <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
                        {warnings.map((warning, index) => <li key={index}>{warning}</li>)}
                    </ul>
                </div>
             )}
            {/* Day Navigation Controls */}
            <div style={styles.navigationContainer}>
                 <button onClick={handlePreviousDay} disabled={currentIndex === 0} style={currentIndex === 0 ? styles.navButtonDisabled : styles.navButton} aria-label="Previous Day">&lt; Prev Day</button>
                 <h3 style={styles.currentDateHeader}>{formatDisplayDate(currentDate)}</h3>
                 <button onClick={handleNextDay} disabled={currentIndex === sortedUniqueDates.length - 1} style={currentIndex === sortedUniqueDates.length - 1 ? styles.navButtonDisabled : styles.navButton} aria-label="Next Day">Next Day &gt;</button>
            </div>
            {/* Display Schedule for the Current Day */}
            {/* Pass completion props down */}
            <DayScheduleView
                scheduleItemsForDay={scheduleForCurrentDay}
                completionStatus={completionStatus}
                onToggleCompletion={onToggleCompletion}
            />
            {/* Export Buttons Container */}
            <div style={styles.exportContainer}>
                 <button onClick={exportToIcs} style={styles.exportButton}> Export to Calendar (.ics) </button>
                 <button onClick={exportToPdfList} style={styles.exportButton}> Print Schedule (PDF List) </button>
            </div>
        </section>
    );
}

// --- Styling ---
const styles = {
    mainHeader: { borderBottom: '2px solid #28a745', paddingBottom: '0.5rem', marginBottom: '1rem' },
    warningBox: { border: '1px solid #ffc107', backgroundColor: '#fff3cd', color: '#856404', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' },
    navigationContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', marginBottom: '1rem', borderBottom: '1px solid #eee' },
    navButton: { padding: '0.5rem 1rem', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.9rem', transition: 'background-color 0.2s ease' },
    navButtonDisabled: { padding: '0.5rem 1rem', cursor: 'not-allowed', backgroundColor: '#cccccc', color: '#666666', border: 'none', borderRadius: '4px', fontSize: '0.9rem', opacity: 0.7 },
    currentDateHeader: { margin: 0, fontSize: '1.2em', fontWeight: 'bold', textAlign: 'center', flexGrow: 1, padding: '0 1rem' },
    scheduleItem: (displayType, rag) => { let baseStyle = { marginBottom: '0.6rem', padding: '0.8rem', border: '1px solid #eee', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem' }; if (displayType === 'exam') { return { ...baseStyle, backgroundColor: '#e6f7ff', borderLeft: `5px solid #007bff` }; } else if (displayType === 'break') { return { ...baseStyle, backgroundColor: '#f8f9fa', borderLeft: `5px solid #6c757d` }; } else { return { ...baseStyle, backgroundColor: '#fff', borderLeft: `5px solid ${rag === 'red' ? '#dc3545' : rag === 'amber' ? '#ffc107' : '#28a745'}` }; } },
    timeSpan: { fontWeight: 'bold', fontFamily: 'monospace', minWidth: '110px', textAlign: 'right', flexShrink: 0 },
    taskSpan: { flexGrow: 1, fontWeight: 500 },
    examLabel: { color: '#0056b3', fontWeight: 'bold' },
    ragIndicator: (rag) => ({ marginLeft: '0.5rem', padding: '0.2em 0.4em', fontSize: '0.8em', fontWeight: 'bold', borderRadius: '3px', color: 'white', backgroundColor: rag === 'red' ? '#dc3545' : rag === 'amber' ? '#ffc107' : '#28a745' }),
    durationSpan: { fontSize: '0.9em', color: '#6c757d', minWidth: '70px', textAlign: 'left', flexShrink: 0 },
    infoText: { marginTop: '1rem', fontStyle: 'italic', color: '#555' },
    noItemsText: { fontStyle: 'italic', color: '#888', textAlign: 'center', padding: '1rem 0' },
    exportContainer: { marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee', textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center' },
    exportButton: { padding: '0.6rem 1.2rem', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.9rem', transition: 'background-color 0.2s ease' },
    // Styles for Completion Tracking
    checkboxContainer: { flexShrink: 0, marginRight: '0.5rem' },
    checkbox: { cursor: 'pointer', width: '1rem', height: '1rem' },
    completedItem: { opacity: 0.6, textDecoration: 'line-through' }
};

export default ScheduleDisplay;








