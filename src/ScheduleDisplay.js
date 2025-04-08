import React, { useState, useEffect, useMemo } from 'react';

// --- Helper Functions ---

// Format date string (e.g., "Monday, 14 Apr 2025")
const formatDisplayDate = (dateISO) => {
    try { const date = new Date(dateISO + 'T00:00:00'); if (isNaN(date)) return dateISO; return date.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); } catch { return dateISO; }
};

// Convert HH:MM or "Various" time to a sortable number (minutes from midnight)
const timeToSortableValue = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return Infinity; const lowerTime = timeString.toLowerCase(); if (lowerTime === 'various') return -1; const match = lowerTime.match(/^(\d{1,2}):(\d{2})$/); if (!match) return Infinity; try { const hours = parseInt(match[1], 10); const minutes = parseInt(match[2], 10); if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return Infinity; return hours * 60 + minutes; } catch { return Infinity; }
};

// *** ADDED Missing Helper: Format Date object as YYYY-MM-DD ***
const formatDateISO = (date) => {
    // Ensure date is a valid Date object
    if (!(date instanceof Date) || isNaN(date)) {
        console.warn("Invalid date passed to formatDateISO:", date);
        return null; // Or return a default/error string
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


// Format Date/Time for iCal (YYYYMMDDTHHMMSS)
const formatIcsDateTime = (dateISO, timeHHMM) => {
    if (!dateISO || !timeHHMM || timeHHMM.toLowerCase() === 'various') {
        return null; // Cannot format without specific time
    }
    // Remove separators from date and time
    const datePart = dateISO.replace(/-/g, '');
    const timePart = timeHHMM.replace(/:/g, '') + '00'; // Add seconds
    return `${datePart}T${timePart}`;
};

// Generate Unique ID for iCal events
const generateUid = () => {
    return 'uid-' + Date.now() + '-' + Math.random().toString(16).substring(2);
};


// --- Component to display items for a SINGLE day ---
const DayScheduleView = ({ scheduleItemsForDay }) => {
     if (!scheduleItemsForDay || scheduleItemsForDay.length === 0) { return <p style={styles.noItemsText}>No revision or exams scheduled for this day.</p>; }
    return (
        <ul style={{ listStyleType: 'none', padding: 0, marginTop: '1rem' }}>
            {scheduleItemsForDay.map((item, index) => (
                <li key={index} style={styles.scheduleItem(item.displayType, item.rag)}>
                    <span style={styles.timeSpan}>{item.displayType === 'exam' ? `${item.startTime}${item.endTime ? ` - ${item.endTime}` : ''}` : `${item.startTime} - ${item.endTime}`}</span>
                    <span style={styles.taskSpan}>{item.displayType === 'exam' && <strong style={styles.examLabel}>[EXAM] </strong>}{item.task}{item.displayType === 'study' && (<span style={styles.ragIndicator(item.rag)}>({item.rag?.toUpperCase()})</span>)}{item.displayType === 'exam' && item.paper && ` (${item.paper})`}{item.displayType === 'exam' && item.location && ` - ${item.location}`}</span>
                    <span style={styles.durationSpan}>{item.displayType !== 'exam' ? `(${item.duration} mins)` : item.duration ? `(${item.duration})` : ''}</span>
                </li>
            ))}
        </ul>
    );
};


// --- Main Schedule Display Component (Now with Export) ---
function ScheduleDisplay({ generatedSchedule, warnings, relevantExams }) {

    const [currentIndex, setCurrentIndex] = useState(0);

    // --- Combine generated schedule and relevant exams ---
    const combinedSchedule = useMemo(() => {
        const revisionItems = (generatedSchedule || []).map(item => ({ ...item, displayType: item.type, sortTime: timeToSortableValue(item.startTime) }));
        const examItems = (relevantExams || []).map(item => {
             let dayOfWeek = 'Unknown'; try { const dateObj = new Date(item.dateISO + 'T00:00:00'); if (!isNaN(dateObj)) dayOfWeek = dateObj.toLocaleDateString('en-GB', { weekday: 'long'}); } catch {}
            return { date: item.dateISO, dayOfWeek: dayOfWeek, startTime: item.startTime, endTime: item.finishTime, task: item.subject, type: 'exam', displayType: 'exam', rag: null, duration: item.duration, paper: item.paper, location: item.location, sortTime: timeToSortableValue(item.startTime) };
        });
        return [...revisionItems, ...examItems];
    }, [generatedSchedule, relevantExams]);

    // --- Calculate sorted unique dates ---
    const sortedUniqueDates = useMemo(() => {
        if (combinedSchedule.length === 0) return []; const uniqueDates = [...new Set(combinedSchedule.map(item => item.date))].filter(Boolean); return uniqueDates.sort();
    }, [combinedSchedule]);

    // --- Effect to reset index ---
    useEffect(() => { setCurrentIndex(0); }, [sortedUniqueDates]);

    // --- Navigation Handlers ---
    const handlePreviousDay = () => { setCurrentIndex(prevIndex => Math.max(0, prevIndex - 1)); };
    const handleNextDay = () => { setCurrentIndex(prevIndex => Math.min(sortedUniqueDates.length - 1, prevIndex + 1)); };

    // --- Filtering and Sorting for Current Day ---
    const currentDate = sortedUniqueDates[currentIndex];
    const scheduleForCurrentDay = useMemo(() => {
        if (!currentDate) return []; return combinedSchedule.filter(item => item.date === currentDate).sort((a, b) => a.sortTime - b.sortTime);
    }, [combinedSchedule, currentDate]);

    // --- Export Functions ---

    // Function to generate and download iCal (.ics) file
    const exportToIcs = () => {
        if (combinedSchedule.length === 0) { alert("No schedule items to export."); return; }
        let icsString = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//YourAppName//IGCSE Revision Planner//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n`; // Added newline consistency
        const sortedFullSchedule = [...combinedSchedule].sort((a, b) => { if (a.date !== b.date) return a.date.localeCompare(b.date); return a.sortTime - b.sortTime; });

        sortedFullSchedule.forEach(item => {
            const dtStart = formatIcsDateTime(item.date, item.startTime);
            const dtEnd = formatIcsDateTime(item.date, item.endTime);
            if (!dtStart || !dtEnd) return; // Skip invalid entries

            let summary = ''; let description = '';
            if (item.displayType === 'study') { summary = `Revise: ${item.task}`; description = `Subject: ${item.task}\\nConfidence: ${item.rag?.toUpperCase() || 'N/A'}\\nDuration: ${item.duration} mins`; }
            else if (item.displayType === 'break') { summary = 'Revision Break'; description = `Duration: ${item.duration} mins`; }
            else if (item.displayType === 'exam') { summary = `EXAM: ${item.task}`; description = `Paper: ${item.paper || 'N/A'}\\nLocation: ${item.location || 'N/A'}\\nDuration: ${item.duration || 'N/A'}`; }

            // Use the NEW formatDateISO helper here for DTSTAMP
            const now = new Date();
            const dtStamp = formatIcsDateTime(formatDateISO(now), now.toTimeString().substring(0, 5));

            // Escape commas, newlines, semicolons in text fields
            const escapeIcsText = (text) => text ? text.replace(/,/g, '\\,').replace(/\n/g, '\\n').replace(/;/g, '\\;') : '';

            icsString += `BEGIN:VEVENT\n`;
            icsString += `UID:${generateUid()}\n`;
            icsString += `DTSTAMP:${dtStamp || ''}\n`; // Use formatted timestamp
            icsString += `DTSTART:${dtStart}\n`;
            icsString += `DTEND:${dtEnd}\n`;
            icsString += `SUMMARY:${escapeIcsText(summary)}\n`;
            icsString += `DESCRIPTION:${escapeIcsText(description)}\n`;
            if (item.location) { icsString += `LOCATION:${escapeIcsText(item.location)}\n`; }
            icsString += `END:VEVENT\n`;
        });

        icsString += `END:VCALENDAR`;

        const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "revision_schedule.ics");
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    // Function to generate HTML table and open for printing to PDF
    const exportToPdfList = () => { /* ... same as before ... */
         if (combinedSchedule.length === 0) { alert("No schedule items to export."); return; }
        const sortedFullSchedule = [...combinedSchedule].sort((a, b) => { if (a.date !== b.date) return a.date.localeCompare(b.date); return a.sortTime - b.sortTime; });
        let htmlString = ` <!DOCTYPE html> <html> <head> <title>Revision Schedule</title> <style> body { font-family: Arial, sans-serif; margin: 20px; } table { width: 100%; border-collapse: collapse; margin-top: 15px; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; word-break: break-word; } th { background-color: #f2f2f2; } tr:nth-child(even) { background-color: #f9f9f9; } h1, h2 { text-align: center; } .exam { background-color: #e6f7ff; font-weight: bold; } .break { background-color: #f0f0f0; font-style: italic; } .study-red { border-left: 4px solid #dc3545; } .study-amber { border-left: 4px solid #ffc107; } .study-green { border-left: 4px solid #28a745; } </style> </head> <body> <h1>IGCSE Revision Schedule</h1> <table> <thead> <tr> <th>Date</th> <th>Day</th> <th>Start</th> <th>End</th> <th>Type</th> <th>Details</th> <th>Duration</th> <th>Location</th> </tr> </thead> <tbody> `;
        sortedFullSchedule.forEach(item => {
            let typeText = ''; let details = item.task; let rowClass = ''; let location = item.location || '';
            if (item.displayType === 'study') { typeText = 'Revision'; details += ` (${item.rag?.toUpperCase()})`; rowClass = `study-${item.rag}`; }
            else if (item.displayType === 'break') { typeText = 'Break'; details = '-'; rowClass = 'break'; }
            else if (item.displayType === 'exam') { typeText = 'EXAM'; details = `${item.task}${item.paper ? ` (${item.paper})` : ''}`; rowClass = 'exam'; }
            htmlString += ` <tr class="${rowClass}"> <td>${item.date}</td> <td>${item.dayOfWeek}</td> <td>${item.startTime}</td> <td>${item.endTime || '-'}</td> <td>${typeText}</td> <td>${details}</td> <td>${item.duration || '-'}</td> <td>${location}</td> </tr> `;
        });
        htmlString += ` </tbody> </table> </body> </html> `;
        const win = window.open("", "_blank");
        if (win) { win.document.write(htmlString); win.document.close(); setTimeout(() => { win.alert("Your schedule is ready...\nUse Print (Ctrl+P or Cmd+P) and 'Save as PDF'."); }, 500); }
        else { alert("Could not open new window. Check popup blocker."); }
    };


    // --- Render Logic ---
     if (sortedUniqueDates.length === 0) { /* ... (same as before) ... */
        if (warnings && warnings.length > 0) { return ( <section> <h2 style={styles.mainHeader}>📅 Generated Schedule Results</h2> <div style={styles.warningBox}> <strong>Heads up!</strong> <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}> {warnings.map((warning, index) => <li key={index}>{warning}</li>)} </ul> </div> <p style={styles.infoText}>No schedule items or exams found.</p> </section> ); }
        return <p style={styles.infoText}>No schedule generated.</p>;
    }

    return (
        <section>
            <h2 style={styles.mainHeader}>📅 Your Generated Revision Schedule</h2>
            {/* Warnings */}
            {warnings && warnings.length > 0 && ( <div style={styles.warningBox}> <strong>Heads up!</strong> <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}> {warnings.map((warning, index) => <li key={index}>{warning}</li>)} </ul> </div> )}
            {/* Day Navigation */}
            <div style={styles.navigationContainer}>
                 <button onClick={handlePreviousDay} disabled={currentIndex === 0} style={currentIndex === 0 ? styles.navButtonDisabled : styles.navButton} aria-label="Previous Day">&lt; Prev Day</button>
                 <h3 style={styles.currentDateHeader}>{formatDisplayDate(currentDate)}</h3>
                 <button onClick={handleNextDay} disabled={currentIndex === sortedUniqueDates.length - 1} style={currentIndex === sortedUniqueDates.length - 1 ? styles.navButtonDisabled : styles.navButton} aria-label="Next Day">Next Day &gt;</button>
            </div>
            {/* Display Schedule for the Current Day */}
            <DayScheduleView scheduleItemsForDay={scheduleForCurrentDay} />
            {/* Export Buttons */}
            <div style={styles.exportContainer}>
                 <button onClick={exportToIcs} style={styles.exportButton}> Export to Calendar (.ics) </button>
                 <button onClick={exportToPdfList} style={styles.exportButton}> Print Schedule (PDF List) </button>
            </div>
        </section>
    );
}

// --- Styling ---
const styles = { /* ... same as before ... */
    mainHeader: { borderBottom: '2px solid #28a745', paddingBottom: '0.5rem', marginBottom: '1rem' },
    warningBox: { border: '1px solid #ffc107', backgroundColor: '#fff3cd', color: '#856404', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' },
    navigationContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', marginBottom: '1rem', borderBottom: '1px solid #eee' },
    navButton: { padding: '0.5rem 1rem', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.9rem', transition: 'background-color 0.2s ease' },
    navButtonDisabled: { padding: '0.5rem 1rem', cursor: 'not-allowed', backgroundColor: '#cccccc', color: '#666666', border: 'none', borderRadius: '4px', fontSize: '0.9rem', opacity: 0.7 },
    currentDateHeader: { margin: 0, fontSize: '1.2em', fontWeight: 'bold', textAlign: 'center', flexGrow: 1, padding: '0 1rem' },
    scheduleItem: (displayType, rag) => { let baseStyle = { marginBottom: '0.6rem', padding: '0.8rem', border: '1px solid #eee', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }; if (displayType === 'exam') { return { ...baseStyle, backgroundColor: '#e6f7ff', borderLeft: `5px solid #007bff` }; } else if (displayType === 'break') { return { ...baseStyle, backgroundColor: '#f8f9fa', borderLeft: `5px solid #6c757d` }; } else { return { ...baseStyle, backgroundColor: '#fff', borderLeft: `5px solid ${rag === 'red' ? '#dc3545' : rag === 'amber' ? '#ffc107' : '#28a745'}` }; } },
    timeSpan: { fontWeight: 'bold', fontFamily: 'monospace', minWidth: '110px', textAlign: 'right', flexShrink: 0 },
    taskSpan: { flexGrow: 1, fontWeight: 500 },
    examLabel: { color: '#0056b3', fontWeight: 'bold' },
    ragIndicator: (rag) => ({ marginLeft: '0.5rem', padding: '0.2em 0.4em', fontSize: '0.8em', fontWeight: 'bold', borderRadius: '3px', color: 'white', backgroundColor: rag === 'red' ? '#dc3545' : rag === 'amber' ? '#ffc107' : '#28a745' }),
    durationSpan: { fontSize: '0.9em', color: '#6c757d', minWidth: '70px', textAlign: 'left', flexShrink: 0 },
    infoText: { marginTop: '1rem', fontStyle: 'italic', color: '#555' },
    noItemsText: { fontStyle: 'italic', color: '#888', textAlign: 'center', padding: '1rem 0' },
    exportContainer: { marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee', textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center' },
    exportButton: { padding: '0.6rem 1.2rem', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.9rem', transition: 'background-color 0.2s ease' }
};

export default ScheduleDisplay;






