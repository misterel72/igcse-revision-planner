import React, { useState, useMemo, useEffect } from 'react';

// Import Child Components (ensure these files exist and are correct)
import ScheduleDisplay from './ScheduleDisplay';
import ExamTimetableDisplay from './ExamTimetableDisplay';
import WellbeingTips from './WellbeingTips';
import ProgressSummary from './ProgressSummary'; // Import ProgressSummary

// Import Scheduling Logic (ensure this file exists and is correct)
import { generateSchedule } from './generateSchedule';

// --- localStorage Keys ---
const LS_KEYS = {
    PLANNER_ENTRIES: 'revisionPlanner_plannerEntries', // Key for the detailed entries
    TIMESLOTS: 'revisionPlanner_timeSlots',
    START_DATE: 'revisionPlanner_startDate',
    END_DATE: 'revisionPlanner_endDate',
    COMPLETION: 'revisionPlanner_completionStatus' // Key for completion tracking
};

// --- React Component ---
function App() {
    // --- State Variables ---

    // NEW State: Array to hold all planner entries (subject/paper/topic/rag/exam details)
    const [plannerEntries, setPlannerEntries] = useState(() => {
        const savedEntries = localStorage.getItem(LS_KEYS.PLANNER_ENTRIES);
        if (savedEntries) {
            try {
                const parsed = JSON.parse(savedEntries);
                // Basic validation: ensure it's an array
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.error("Failed to parse saved planner entries from localStorage:", e);
                return []; // Return default empty array if parsing fails
            }
        }
        return []; // Default empty array if nothing in localStorage
    });

    // State for the NEW input form fields used to add a planner entry
    const [subjectNameInput, setSubjectNameInput] = useState('');
    const [paperOrTopicInput, setPaperOrTopicInput] = useState('');
    const [ragInput, setRagInput] = useState('red'); // Default RAG for new entries
    const [examDateInput, setExamDateInput] = useState(''); // Initialize as empty YYYY-MM-DD
    const [examStartTimeInput, setExamStartTimeInput] = useState(''); // Initialize as empty HH:MM
    const [examEndTimeInput, setExamEndTimeInput] = useState(''); // Initialize as empty HH:MM
    const [examLocationInput, setExamLocationInput] = useState('');

    // State for Weekly Availability (including fixed breaks) - Load initial state from localStorage
    const [day, setDay] = useState('Sunday'); // Default day is Sunday
    const [startTime, setStartTime] = useState('16:00');
    const [endTime, setEndTime] = useState('17:00');
    const [slotType, setSlotType] = useState('revision'); // 'revision' or 'fixed_break'
    const [weeklyTimeSlots, setWeeklyTimeSlots] = useState(() => {
         const saved = localStorage.getItem(LS_KEYS.TIMESLOTS);
         try {
             const parsed = JSON.parse(saved);
             return Array.isArray(parsed) ? parsed : [];
         } catch (e) {
             console.error("Failed to parse saved time slots from localStorage:", e);
             return [];
         }
    });

    // State for Revision Period - Load initial state from localStorage
    const defaultStartDate = '2025-04-20'; // Example default start date
    const defaultEndDate = '2025-06-11';   // Example default end date
    const [startDate, setStartDate] = useState(() => localStorage.getItem(LS_KEYS.START_DATE) || defaultStartDate);
    const [endDate, setEndDate] = useState(() => localStorage.getItem(LS_KEYS.END_DATE) || defaultEndDate);

    // State for Generated Schedule - Unchanged
    const [scheduleResult, setScheduleResult] = useState({ schedule: [], warnings: [] });
    const [isGenerating, setIsGenerating] = useState(false);

    // State for Completion Status
    const [completionStatus, setCompletionStatus] = useState(() => {
        const savedStatus = localStorage.getItem(LS_KEYS.COMPLETION);
        if (savedStatus) {
            try {
                const parsed = JSON.parse(savedStatus);
                // Basic validation: ensure it's an object
                return typeof parsed === 'object' && parsed !== null ? parsed : {};
            } catch (e) {
                console.error("Failed to parse saved completion status:", e);
                return {}; // Return default empty object if parsing fails
            }
        }
        return {}; // Default empty object
    });


    // --- Effects to SAVE state changes to localStorage ---
    // Save plannerEntries whenever it changes
    useEffect(() => {
        localStorage.setItem(LS_KEYS.PLANNER_ENTRIES, JSON.stringify(plannerEntries));
    }, [plannerEntries]);

    // Save weeklyTimeSlots whenever it changes
    useEffect(() => {
        localStorage.setItem(LS_KEYS.TIMESLOTS, JSON.stringify(weeklyTimeSlots));
    }, [weeklyTimeSlots]);

    // Save startDate whenever it changes
    useEffect(() => {
        localStorage.setItem(LS_KEYS.START_DATE, startDate);
    }, [startDate]);

    // Save endDate whenever it changes
    useEffect(() => {
        localStorage.setItem(LS_KEYS.END_DATE, endDate);
    }, [endDate]);

    // Save completionStatus whenever it changes
    useEffect(() => {
        localStorage.setItem(LS_KEYS.COMPLETION, JSON.stringify(completionStatus));
    }, [completionStatus]);


    // --- Event Handlers ---

    // Handler to add a subject/paper/topic entry
    const handleAddPlannerEntry = () => {
        // Validation: Subject, Paper/Topic, and Exam Date are required
        if (!subjectNameInput.trim() || !paperOrTopicInput.trim()) {
            alert("Please enter both a Subject Name and a Paper/Topic Name.");
            return;
        }
        if (!examDateInput) { // Check if exam date is entered
            alert("Please enter the Exam Date for this subject/paper.\n(This is needed to know when to stop scheduling revision).");
            return;
        }
        // Optional validation for start/end time if date is entered
        if (examDateInput && examStartTimeInput && examEndTimeInput && examStartTimeInput >= examEndTimeInput) {
             alert("Exam End Time must be after Exam Start Time.");
             return;
        }

        // Create the new entry object
        const newEntry = {
            id: Date.now(), // Simple unique ID based on timestamp
            subjectName: subjectNameInput.trim(),
            paperOrTopic: paperOrTopicInput.trim(),
            rag: ragInput,
            // examDetails will always exist now, as date is required
            examDetails: {
                date: examDateInput, // Store as YYYY-MM-DD string
                startTime: examStartTimeInput || null, // Store HH:MM string or null
                finishTime: examEndTimeInput || null, // Store HH:MM string or null
                location: examLocationInput.trim() || null // Store string or null
            }
        };

        // Update state using functional update to ensure atomicity
        setPlannerEntries(prevEntries => [...prevEntries, newEntry]);

        // Clear input fields after adding (keeping subject name might be useful)
        // setSubjectNameInput(''); // Optional: clear subject name too
        setPaperOrTopicInput('');
        setRagInput('red'); // Reset RAG to default
        setExamDateInput('');
        setExamStartTimeInput('');
        setExamEndTimeInput('');
        setExamLocationInput('');
    };

    // Handler to remove a planner entry by ID
    const handleRemovePlannerEntry = (idToRemove) => {
        setPlannerEntries(prevEntries => prevEntries.filter(entry => entry.id !== idToRemove));
    };

    // Handler for adding weekly slots
    const addTimeSlot = () => {
        const isValidTime = (time) => time && time.match(/^\d{2}:\d{2}$/);
        if (!isValidTime(startTime) || !isValidTime(endTime) || startTime >= endTime) {
             console.warn("Invalid time slot input: Ensure HH:MM format and end time is after start time.");
             // Consider adding a user-visible error message state here
             return;
        }
        // Add the type ('revision' or 'fixed_break') to the slot object
        setWeeklyTimeSlots(prev => [...prev, { day, startTime, endTime, type: slotType }]);
    };

    // Handler for removing weekly slots
    const removeTimeSlot = (indexToRemove) => {
         setWeeklyTimeSlots(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    // Handler to Toggle Completion Status
    const handleToggleCompletion = (itemId) => {
        setCompletionStatus(prevStatus => ({
            ...prevStatus,
            [itemId]: !prevStatus[itemId] // Toggle the boolean value
        }));
    };

    // --- Filter Exam Timetable (Derived from plannerEntries) ---
    // This creates the list needed for the ExamTimetableDisplay component
    const userExamTimetable = useMemo(() => {
        return plannerEntries
            .filter(entry => entry.examDetails && entry.examDetails.date) // Filter for entries with an exam date
            .map(entry => ({ // Map to the format ExamTimetableDisplay expects
                dateString: entry.examDetails.date, // Consider formatting later if needed
                dateISO: entry.examDetails.date,
                subject: `${entry.subjectName} - ${entry.paperOrTopic}`, // Combine names for display
                paper: entry.paperOrTopic, // Keep separate
                startTime: entry.examDetails.startTime || 'N/A',
                finishTime: entry.examDetails.finishTime || 'N/A',
                duration: '-', // Duration wasn't input, could calculate later
                location: entry.examDetails.location || 'N/A'
            }))
            .sort((a, b) => { // Sort by date then time
                const dateComparison = a.dateISO.localeCompare(b.dateISO);
                if (dateComparison !== 0) return dateComparison;
                // Handle 'N/A' or null times during sort
                const timeA = a.startTime === 'N/A' ? '' : a.startTime;
                const timeB = b.startTime === 'N/A' ? '' : b.startTime;
                return timeA.localeCompare(timeB);
            });
    }, [plannerEntries]); // Dependency: recalculate when 'plannerEntries' state changes


    // --- Calculate Progress Stats ---
    const progressStats = useMemo(() => {
        const stats = {}; // Use an object keyed by entry id for easier lookup

        // Initialize stats for each entry
        plannerEntries.forEach(entry => {
            // Use entry.id which is guaranteed unique
            stats[entry.id] = {
                id: entry.id, // Keep id for keying later if needed
                subjectName: entry.subjectName,
                paperOrTopic: entry.paperOrTopic,
                totalMinutes: 0,
                completedMinutes: 0,
            };
        });

        // Iterate through the generated schedule (only study items)
        (scheduleResult.schedule || [])
            .filter(item => item.type === 'study')
            .forEach(item => {
                // Find the corresponding planner entry for this study block
                // Task format is "Revise: SubjectName - PaperOrTopic"
                const taskParts = item.task.replace(/^Revise:\s*/, '').split(' - ');
                if (taskParts.length < 2) return; // Skip if format is unexpected
                const subjectName = taskParts[0];
                const paperOrTopic = taskParts.slice(1).join(' - '); // Handle cases where paper/topic has '-'

                // Find the FIRST matching entry (in case of duplicates, though UI should prevent)
                const matchingEntry = plannerEntries.find(
                    entry => entry.subjectName === subjectName && entry.paperOrTopic === paperOrTopic
                );

                if (matchingEntry && stats[matchingEntry.id]) {
                    const duration = item.duration || 0; // Duration should be present
                    stats[matchingEntry.id].totalMinutes += duration;

                    // Check completion status using the generated item ID
                    // Ensure ID format matches the one generated in ScheduleDisplay
                    const itemId = `${item.date}_${item.startTime}_${item.task}`;
                    if (completionStatus[itemId]) {
                        stats[matchingEntry.id].completedMinutes += duration;
                    }
                } else {
                    // console.warn(`Could not find matching planner entry for scheduled task: ${item.task}`);
                }
            });

        // Convert stats object to an array and calculate percentage
        return Object.values(stats).map(stat => ({
            ...stat,
            percentage: stat.totalMinutes > 0
                ? Math.round((stat.completedMinutes / stat.totalMinutes) * 100)
                : 0
        })).sort((a,b) => a.subjectName.localeCompare(b.subjectName) || a.paperOrTopic.localeCompare(b.paperOrTopic)); // Sort alphabetically

    }, [plannerEntries, scheduleResult.schedule, completionStatus]); // Dependencies


    // --- Schedule Generation Handler ---
    const handleGenerateSchedule = () => {
        // Basic check for necessary inputs before starting generation
        if (plannerEntries.length === 0 || weeklyTimeSlots.length === 0 || !startDate || !endDate) {
            setScheduleResult({ schedule: [], warnings: ["Please add subjects/papers, time slots, and set dates before generating."] });
            return;
        }

        setIsGenerating(true); // Show loading indicator
        setScheduleResult({ schedule: [], warnings: [] }); // Clear previous results

        // Use setTimeout to allow UI update before potentially long calculation
        setTimeout(() => {
            try {
                // Call the main generation function from the imported module
                // Ensure generateSchedule is updated to handle plannerEntries correctly
                const result = generateSchedule(
                    plannerEntries, // Pass the new detailed entries array
                    weeklyTimeSlots,
                    startDate,
                    endDate
                    // No longer pass separate exam data
                );
                setScheduleResult(result); // Update state with the generated schedule and any warnings
            } catch (error) {
                // Catch unexpected errors during generation
                console.error("Error generating schedule:", error);
                setScheduleResult({ schedule: [], warnings: ["An unexpected error occurred during schedule generation. Check console for details."] });
            } finally {
                setIsGenerating(false); // Hide loading indicator regardless of success/failure
            }
        }, 50); // Small delay
    };

    // --- Helper for Date Input ---
    const formatDateForInput = (dateStr) => {
        // Check if the format is already YYYY-MM-DD
        if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }
        // Attempt conversion only if needed (less robust for other formats)
        try {
            const date = new Date(dateStr + 'T00:00:00'); // Ensure parsing as local date
            if (isNaN(date)) return ''; // Return empty if invalid date string
            // Format to YYYY-MM-DD
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch {
            return ''; // Return empty on error
        }
     };


    // --- JSX ---
    return (
        // Main container div
        <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: 'auto' }}>
            {/* Header */}
            <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ color: '#333' }}>📅 Universal Revision Planner</h1>
            </header>

            {/* Main content area using CSS Grid */}
            <main style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.5fr) minmax(400px, 1.5fr)', gap: '2rem' }}>

                {/* --- Column 1: Inputs & Controls --- */}
                <section>
                    {/* Step 1 Card: Revision Period */}
                    <div style={styles.card}>
                        <h2>Step 1: Revision Period</h2>
                        <div style={styles.inputGroup}>
                            <label htmlFor="startDate" style={styles.label}>Start Date:</label>
                            <input type="date" id="startDate" value={formatDateForInput(startDate)} onChange={(e) => setStartDate(e.target.value)} style={styles.input} required />
                        </div>
                        <div style={styles.inputGroup}>
                            <label htmlFor="endDate" style={styles.label}>End Date:</label>
                            <input type="date" id="endDate" value={formatDateForInput(endDate)} onChange={(e) => setEndDate(e.target.value)} style={styles.input} required />
                        </div>
                    </div>

                    {/* Step 2 Card: Add Subject/Paper/Topic */}
                    <div style={styles.card}>
                        <h2>Step 2: Add Subject / Paper / Topic</h2>
                        <p style={styles.infoTextSmall}>Add each subject paper or distinct topic you need to revise. Exam Date is required for planning.</p>
                        {/* Grid layout for input form */}
                        <div style={styles.inputGrid}>
                             <label htmlFor="subjectName" style={styles.label}>Subject Name*:</label>
                             <input type="text" id="subjectName" value={subjectNameInput} onChange={(e) => setSubjectNameInput(e.target.value)} style={styles.input} placeholder="e.g., A-Level Maths" required />

                             <label htmlFor="paperTopic" style={styles.label}>Paper / Topic*:</label>
                             <input type="text" id="paperTopic" value={paperOrTopicInput} onChange={(e) => setPaperOrTopicInput(e.target.value)} style={styles.input} placeholder="e.g., Paper 1 Pure" required />

                             <label htmlFor="rag" style={styles.label}>Confidence (RAG)*:</label>
                             <select id="rag" value={ragInput} onChange={(e) => setRagInput(e.target.value)} style={styles.input} required>
                                <option value="red">🔴 Red (Need Focus)</option>
                                <option value="amber">🟠 Amber (Okay-ish)</option>
                                <option value="green">🟢 Green (Confident)</option>
                            </select>

                            {/* Exam Date - Now Required */}
                            <label htmlFor="examDate" style={styles.label}>Exam Date*:</label>
                            <input
                                type="date"
                                id="examDate"
                                value={examDateInput}
                                onChange={(e) => setExamDateInput(e.target.value)}
                                style={styles.input}
                                required // HTML5 required attribute
                            />

                            {/* Exam Times - Optional but linked to date */}
                            <label htmlFor="examStart" style={styles.label}>Exam Start Time:</label>
                            <input type="time" id="examStart" value={examStartTimeInput} onChange={(e) => setExamStartTimeInput(e.target.value)} style={styles.input} disabled={!examDateInput} />

                            <label htmlFor="examEnd" style={styles.label}>Exam End Time:</label>
                            <input type="time" id="examEnd" value={examEndTimeInput} onChange={(e) => setExamEndTimeInput(e.target.value)} style={styles.input} disabled={!examDateInput} />

                             {/* Exam Location - Optional */}
                             <label htmlFor="examLocation" style={styles.label}>Exam Location:</label>
                             <input type="text" id="examLocation" value={examLocationInput} onChange={(e) => setExamLocationInput(e.target.value)} style={styles.input} placeholder="e.g., Main Hall" disabled={!examDateInput} />
                        </div>
                        {/* Add Button */}
                        <div style={{textAlign: 'right', marginTop: '1rem'}}>
                             <button onClick={handleAddPlannerEntry} style={styles.buttonPrimary}>Add Entry</button>
                        </div>

                        {/* List of Added Entries */}
                        <h3 style={{marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1rem'}}>Your Subjects & Papers:</h3>
                        <ul style={styles.list}>
                            {plannerEntries.map((entry) => (
                                <li key={entry.id} style={styles.listItem}>
                                    {/* Display entry details */}
                                    <span>
                                        <strong>{entry.subjectName}</strong> - {entry.paperOrTopic}
                                        <span style={styles.ragDisplay(entry.rag)}> ({entry.rag.toUpperCase()})</span>
                                        {/* Display exam date clearly */}
                                        <span style={styles.examDateDisplay}> - Exam: {entry.examDetails?.date || 'N/A'}</span>
                                    </span>
                                    {/* Remove button */}
                                    <button onClick={() => handleRemovePlannerEntry(entry.id)} style={styles.buttonDangerSmall} aria-label={`Remove ${entry.subjectName} - ${entry.paperOrTopic}`}>X</button>
                                </li>
                            ))}
                        </ul>
                        {/* Message if list is empty */}
                        {plannerEntries.length === 0 && <p style={styles.infoTextSmall}>Add the subjects/papers you need to revise using the form above.</p>}
                    </div>


                    {/* Step 3 Card: Weekly Availability */}
                    <div style={styles.card}>
                        <h2>Step 3: Weekly Availability</h2>
                        <p style={styles.infoTextSmall}>
                            Map out your typical weekly free time slots. Select a day, the start and end time, and specify if it's for 'Revision Time' or a 'Fixed Break'.
                        </p>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', marginTop: '1rem' }}>
                            <select value={day} onChange={(e) => setDay(e.target.value)} style={{...styles.input, flexBasis: '130px'}} aria-label="Day of week">
                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (<option key={d} value={d}>{d}</option>))}
                            </select>
                            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{...styles.input, flexBasis: '90px'}} aria-label="Start time"/>
                            <span style={{padding: '0 0.2rem'}}>to</span>
                            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{...styles.input, flexBasis: '90px'}} aria-label="End time"/>
                             <select value={slotType} onChange={(e) => setSlotType(e.target.value)} style={{...styles.input, flexBasis: '130px'}} aria-label="Slot type">
                                 <option value="revision">Revision Time</option>
                                 <option value="fixed_break">Fixed Break (e.g., Lunch)</option>
                             </select>
                            <button onClick={addTimeSlot} style={styles.buttonPrimary}>Add</button>
                        </div>
                         <ul style={styles.list}>
                            {weeklyTimeSlots.map((slot, index) => (
                                <li key={index} style={styles.listItem}>
                                    <span>
                                        {slot.day}: {slot.startTime} - {slot.endTime}
                                        {slot.type === 'fixed_break' && <em style={styles.slotTypeLabel}> (Fixed Break)</em>}
                                    </span>
                                    <button onClick={() => removeTimeSlot(index)} style={styles.buttonDangerSmall} aria-label={`Remove ${slot.day} ${slot.startTime} slot`}>X</button>
                                </li>
                            ))}
                        </ul>
                        {weeklyTimeSlots.length === 0 && <p style={styles.infoTextSmall}>Add the times you are free each week.</p>}
                    </div>

                     {/* Step 4 Card: Generate Button */}
                     <div style={{ ...styles.card, textAlign: 'center', backgroundColor: '#e9f5ea' }}>
                        <h2>Step 4: Generate Schedule</h2>
                        <button
                            onClick={handleGenerateSchedule}
                            style={ (plannerEntries.length === 0 || weeklyTimeSlots.length === 0 || !startDate || !endDate || isGenerating) ? styles.buttonSuccessLargeDisabled : styles.buttonSuccessLarge }
                            disabled={plannerEntries.length === 0 || weeklyTimeSlots.length === 0 || !startDate || !endDate || isGenerating}
                        >
                            {isGenerating ? 'Generating...' : '✨ Generate My Revision Plan ✨'}
                        </button>
                        {isGenerating && <p style={styles.infoText}>Please wait...</p>}
                        {(!isGenerating && (plannerEntries.length === 0 || weeklyTimeSlots.length === 0 || !startDate || !endDate)) &&
                            <p style={styles.infoText}>Please complete Steps 1-3 first.</p>
                        }
                    </div>

                    {/* Wellbeing Tips Component */}
                     <div style={styles.card}>
                         <WellbeingTips />
                     </div>
                </section>

                {/* --- Column 2: Outputs --- */}
                <section>
                     {/* Progress Summary Component */}
                    {plannerEntries.length > 0 && (
                         <div style={styles.card}>
                            <ProgressSummary stats={progressStats} />
                         </div>
                    )}

                    {/* Generated Schedule Display */}
                    {(scheduleResult.schedule.length > 0 || scheduleResult.warnings.length > 0) && (
                        <div style={styles.card}>
                            {/* Pass completionStatus and handler down */}
                            <ScheduleDisplay
                                generatedSchedule={scheduleResult.schedule}
                                warnings={scheduleResult.warnings}
                                plannerEntries={plannerEntries} // Pass full entries
                                completionStatus={completionStatus} // Pass current status
                                onToggleCompletion={handleToggleCompletion} // Pass handler function
                            />
                        </div>
                    )}

                     {/* Detailed Exam Timetable Display */}
                     <div style={styles.card}>
                         {/* Pass userExamTimetable derived from plannerEntries */}
                         <ExamTimetableDisplay timetable={userExamTimetable} />
                     </div>
                </section>
            </main>
        </div>
    );
}

// --- Basic Styling ---
// Includes styles for cards, inputs, buttons, lists, grid etc.
const styles = {
    card: { marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#ffffff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
    inputGroup: { marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
    inputGrid: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.8rem 1rem', alignItems: 'center', marginTop: '1rem' },
    label: { minWidth: '80px', fontWeight: 'bold', textAlign: 'right', paddingRight: '0.5em' }, // Added padding for spacing
    input: { padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box', fontSize: '0.9rem' }, // Ensure input takes full grid cell width
    buttonPrimary: { padding: '0.6rem 1rem', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.9rem', whiteSpace: 'nowrap' },
    buttonSuccessLarge: { padding: '0.8rem 1.5rem', fontSize: '1.1rem', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', opacity: 1, transition: 'opacity 0.3s ease, background-color 0.3s ease' },
    buttonSuccessLargeDisabled: { padding: '0.8rem 1.5rem', fontSize: '1.1rem', cursor: 'not-allowed', backgroundColor: '#cccccc', color: '#666666', border: 'none', borderRadius: '5px', opacity: 0.6 },
    buttonDangerSmall: { marginLeft: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.8rem', lineHeight: '1', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', flexShrink: 0 },
    list: { listStyle: 'none', paddingLeft: 0, marginTop: '1rem', maxHeight: '250px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px', padding: '0.5rem' }, // Increased maxHeight
    listItem: { marginBottom: '0.5rem', padding: '0.5rem 0.8rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fdfdfd', gap: '0.5rem' }, // Added gap
    infoText: { marginTop: '1rem', fontStyle: 'italic', color: '#555' },
    infoTextSmall: { fontSize: '0.85rem', fontStyle: 'italic', color: '#777', marginTop: '0.5rem', marginBottom: '1rem' }, // Added margin-bottom
    slotTypeLabel: { marginLeft: '0.5rem', fontSize: '0.85em', fontStyle: 'italic', color: '#6c757d' },
    // Style for RAG display in the list
    ragDisplay: (rag) => ({ display: 'inline-block', marginLeft: '0.5rem', padding: '0.1em 0.4em', fontSize: '0.8em', fontWeight: 'bold', borderRadius: '3px', color: 'white', backgroundColor: rag === 'red' ? '#dc3545' : rag === 'amber' ? '#ffc107' : '#28a745' }),
    // Style for exam date display in the list
    examDateDisplay: { marginLeft: '0.5rem', fontSize: '0.85em', color: '#0056b3' } // Blue to indicate exam info
};

export default App;


