import React, { useState, useMemo, useEffect } from 'react';

// Import Child Components
import ScheduleDisplay from './ScheduleDisplay';
import ExamTimetableDisplay from './ExamTimetableDisplay';
import WellbeingTips from './WellbeingTips';

// Import Scheduling Logic
import { generateSchedule } from './generateSchedule';

// --- localStorage Keys ---
const LS_KEYS = {
    SUBJECTS: 'revisionPlanner_subjects',
    TIMESLOTS: 'revisionPlanner_timeSlots',
    START_DATE: 'revisionPlanner_startDate',
    END_DATE: 'revisionPlanner_endDate'
};

// --- Static Data ---
const subjectOptions = [
    'Arabic 1st Language', 'Arabic 2nd Language', 'Art', 'Biology', 'Business Studies',
    'Chemistry', 'Computer Science', 'Design and Technology', 'Economics',
    'English 1st Language', 'English 2nd Language', 'English Literature',
    'Geography', 'ICT', 'Mathematics', 'Physical Education', 'Physics'
];

// Simple Exam Dates Map (Subject Name -> First Exam Date YYYY-MM-DD)
// Used ONLY for prioritisation logic in generateSchedule
const examDatesForPrioritisation = { // Using base names from subjectOptions
    'Arabic 2nd Language': '2025-04-14',
    'English 2nd Language': '2025-04-14',
    'ICT': '2025-04-15',
    'Art': '2025-04-22',
    'Chemistry': '2025-04-30',
    'Mathematics': '2025-05-02',
    'Biology': '2025-05-06',
    'Geography': '2025-05-06',
    'English 1st Language': '2025-05-08',
    'Physics': '2025-05-09',
    'Computer Science': '2025-05-12',
    'English Literature': '2025-05-12',
    'Design and Technology': '2025-05-13',
    'Arabic 1st Language': '2025-05-13',
    'Business Studies': '2025-05-16',
    'Physical Education': '2025-05-20',
    'Economics': '2025-05-23'
    // Add other subjects from subjectOptions here if they have exams
};

// Full Detailed Exam Timetable (for display purposes)
// Derived from user-provided timetable text (assuming 2025)
const fullExamTimetable = [ // Using detailed names from original timetable
    { dateString: 'Monday 13th April', dateISO: '2025-04-14', subject: 'Arabic 2nd Language Orals', paper: '', startTime: 'Various', finishTime: '', duration: '', location: 'U9' },
    { dateString: 'Monday 13th April', dateISO: '2025-04-14', subject: 'English 2nd Language Orals', paper: '', startTime: 'Various', finishTime: '', duration: '', location: 'OM1' },
    { dateString: 'Tuesday 15th April', dateISO: '2025-04-15', subject: 'ICT', paper: 'Paper 2 ( Practical )', startTime: '8:30', finishTime: '10:45', duration: '2:15', location: 'G14' },
    { dateString: 'Thursday 17th April', dateISO: '2025-04-17', subject: 'ICT', paper: 'Paper 3 ( Practical )', startTime: '8:30', finishTime: '10:45', duration: '2:15', location: 'G14' },
    { dateString: 'Tuesday 22nd April', dateISO: '2025-04-22', subject: 'Art', paper: '1', startTime: '8:30', finishTime: '10:30', duration: '2:00', location: 'Art' },
    { dateString: 'Tuesday 22nd April', dateISO: '2025-04-22', subject: 'Art', paper: '1', startTime: '11:00', finishTime: '13:00', duration: '2:00', location: 'Art' },
    { dateString: 'Wednesday 23rd April', dateISO: '2025-04-23', subject: 'Art', paper: '1', startTime: '8:30', finishTime: '11:30', duration: '3:00', location: 'Art' },
    { dateString: 'Wednesday 23rd April', dateISO: '2025-04-23', subject: 'Art', paper: '1', startTime: '11:00', finishTime: '13:00', duration: '2:00', location: 'Art' },
    { dateString: 'Monday 28th April', dateISO: '2025-04-28', subject: 'Arabic 2nd Language', paper: '2', startTime: '13:00', finishTime: '14:00', duration: '1:00', location: 'Auditorium' },
    { dateString: 'Wednesday 30th April', dateISO: '2025-04-30', subject: 'Chemistry Extended', paper: '4', startTime: '9:00', finishTime: '10:15', duration: '1:15', location: 'Auditorium' },
    { dateString: 'Wednesday 30th April', dateISO: '2025-04-30', subject: 'Chemistry Core', paper: '3', startTime: '9:00', finishTime: '10:15', duration: '1:15', location: 'Auditorium' },
    { dateString: 'Friday 2nd May', dateISO: '2025-05-02', subject: 'Mathematics Extended', paper: '2', startTime: '13:00', finishTime: '15:00', duration: '2:00', location: 'Auditorium' },
    { dateString: 'Friday 2nd May', dateISO: '2025-05-02', subject: 'Mathematics Core', paper: '1', startTime: '13:00', finishTime: '14:30', duration: '1:30', location: 'Auditorium' },
    { dateString: 'Tuesday 6th May', dateISO: '2025-05-06', subject: 'Biology Extended', paper: '4', startTime: '9:00', finishTime: '10:15', duration: '1:15', location: 'Auditorium' },
    { dateString: 'Tuesday 6th May', dateISO: '2025-05-06', subject: 'Biology Core', paper: '3', startTime: '9:00', finishTime: '10:15', duration: '1:15', location: 'Auditorium' },
    { dateString: 'Tuesday 6th May', dateISO: '2025-05-06', subject: 'Geography', paper: '1', startTime: '13:00', finishTime: '14:45', duration: '1:45', location: 'Auditorium' },
    { dateString: 'Wednesday 7th May', dateISO: '2025-05-07', subject: 'Mathematics Extended', paper: '4', startTime: '13:00', finishTime: '15:00', duration: '2:00', location: 'Auditorium' },
    { dateString: 'Wednesday 7th May', dateISO: '2025-05-07', subject: 'Mathematics Core', paper: '3', startTime: '13:00', finishTime: '14:30', duration: '1:30', location: 'Auditorium' },
    { dateString: 'Thursday 8th May', dateISO: '2025-05-08', subject: 'English 1st Language', paper: '1', startTime: '9:00', finishTime: '11:00', duration: '2:00', location: 'Auditorium' },
    { dateString: 'Thursday 8th May', dateISO: '2025-05-08', subject: 'English 2nd Language', paper: '1', startTime: '9:00', finishTime: '11:00', duration: '2:00', location: 'Auditorium' },
    { dateString: 'Thursday 8th May', dateISO: '2025-05-08', subject: 'ICT', paper: '1', startTime: '13:00', finishTime: '14:30', duration: '1:30', location: 'Auditorium' },
    { dateString: 'Friday 9th May', dateISO: '2025-05-09', subject: 'Physics Extended', paper: '4', startTime: '9:00', finishTime: '10:15', duration: '1:15', location: 'Auditorium' },
    { dateString: 'Friday 9th May', dateISO: '2025-05-09', subject: 'Physics Core', paper: '3', startTime: '9:00', finishTime: '10:15', duration: '1:15', location: 'Auditorium' },
    { dateString: 'Monday 12th May', dateISO: '2025-05-12', subject: 'Computer Science', paper: '1', startTime: '9:00', finishTime: '10:45', duration: '1:45', location: 'Auditorium' },
    { dateString: 'Monday 12th May', dateISO: '2025-05-12', subject: 'English Literature', paper: '1', startTime: '13:00', finishTime: '14:30', duration: '1:30', location: 'Auditorium' },
    { dateString: 'Tuesday 13th May', dateISO: '2025-05-13', subject: 'Biology Core and Extended', paper: '6', startTime: '9:00', finishTime: '10:00', duration: '1:00', location: 'Auditorium' },
    { dateString: 'Tuesday 13th May', dateISO: '2025-05-13', subject: 'Design and Technology', paper: '1', startTime: '11:00', finishTime: '12:15', duration: '1:15', location: 'Gallery' },
    { dateString: 'Tuesday 13th May', dateISO: '2025-05-13', subject: 'Arabic 1st Language', paper: '1', startTime: '13:00', finishTime: '15:00', duration: '2:00', location: 'Gallery' },
    { dateString: 'Wednesday 14th May', dateISO: '2025-05-14', subject: 'English 1st Language', paper: '2', startTime: '9:00', finishTime: '11:00', duration: '2:00', location: 'Auditorium' },
    { dateString: 'Wednesday 14th May', dateISO: '2025-05-14', subject: 'English Literature', paper: '3', startTime: '13:00', finishTime: '13:45', duration: '0:45', location: 'Auditorium' },
    { dateString: 'Thursday 15th May', dateISO: '2025-05-15', subject: 'Chemistry Extended/Core', paper: '6', startTime: '9:00', finishTime: '10:00', duration: '1:00', location: 'Auditorium' },
    { dateString: 'Thursday 15th May', dateISO: '2025-05-15', subject: 'Geography', paper: '2', startTime: '13:00', finishTime: '14:30', duration: '1:30', location: 'Auditorium' },
    { dateString: 'Friday 16th May', dateISO: '2025-05-16', subject: 'Business Studies', paper: '1', startTime: '9:00', finishTime: '10:30', duration: '1:30', location: 'Auditorium' },
    { dateString: 'Monday 19th May', dateISO: '2025-05-19', subject: 'Business Studies', paper: '2', startTime: '9:00', finishTime: '10:30', duration: '1:30', location: 'Auditorium' },
    { dateString: 'Tuesday 20th May', dateISO: '2025-05-20', subject: 'Physics Extended/Core', paper: '6', startTime: '9:00', finishTime: '10:00', duration: '1:00', location: 'Auditorium' },
    { dateString: 'Tuesday 20th May', dateISO: '2025-05-20', subject: 'Geography', paper: '4', startTime: '11:00', finishTime: '12:30', duration: '1:30', location: 'Gallery' },
    { dateString: 'Tuesday 20th May', dateISO: '2025-05-20', subject: 'Physical Education', paper: '1', startTime: '13:00', finishTime: '14:45', duration: '1:45', location: 'Gallery' },
    { dateString: 'Wednesday 21st May', dateISO: '2025-05-21', subject: 'Computer Science', paper: '2', startTime: '9:00', finishTime: '10:45', duration: '1:45', location: 'Auditorium' },
    { dateString: 'Wednesday 21st May', dateISO: '2025-05-21', subject: 'Arabic 1st Language', paper: '2', startTime: '12:00', finishTime: '14:00', duration: '2:00', location: 'Auditorium' },
    { dateString: 'Wednesday 21st May', dateISO: '2025-05-21', subject: 'Arabic 2nd Language - Listening', paper: '1', startTime: '12:00', finishTime: '12:50', duration: '0:50', location: 'OM3' },
    { dateString: 'Wednesday 21st May', dateISO: '2025-05-21', subject: 'Arabic 2nd Language', paper: '4', startTime: '12:50', finishTime: '13:50', duration: '1:00', location: 'OM3' },
    { dateString: 'Thursday 22nd May', dateISO: '2025-05-22', subject: 'English 2nd Language - Listening', paper: '2', startTime: '9:00', finishTime: '9:50', duration: '0:50', location: 'OM3' },
    { dateString: 'Friday 23rd May', dateISO: '2025-05-23', subject: 'Economics', paper: '2', startTime: '8:00', finishTime: '10:15', duration: '2:15', location: 'Auditorium' },
    { dateString: 'Wednesday 4th June', dateISO: '2025-06-04', subject: 'Physics Extended', paper: '2', startTime: '8:30', finishTime: '9:15', duration: '0:45', location: 'Auditorium' },
    { dateString: 'Wednesday 4th June', dateISO: '2025-06-04', subject: 'Physics Core', paper: '1', startTime: '8:30', finishTime: '9:15', duration: '0:45', location: 'Auditorium' },
    { dateString: 'Thursday 5th June', dateISO: '2025-06-05', subject: 'Design and Technology', paper: '3', startTime: '12:00', finishTime: '13:00', duration: '1:00', location: 'Auditorium' },
    { dateString: 'Thursday 5th June', dateISO: '2025-06-05', subject: 'Economics', paper: '1', startTime: '8:30', finishTime: '9:15', duration: '0:45', location: 'Auditorium' },
    { dateString: 'Tuesday 10th June', dateISO: '2025-06-10', subject: 'Chemistry Extended', paper: '2', startTime: '8:30', finishTime: '9:15', duration: '0:45', location: 'Auditorium' },
    { dateString: 'Tuesday 10th June', dateISO: '2025-06-10', subject: 'Chemistry Core', paper: '1', startTime: '8:30', finishTime: '9:15', duration: '0:45', location: 'Auditorium' },
    { dateString: 'Wednesday 11th June', dateISO: '2025-06-11', subject: 'Biology Extended', paper: '2', startTime: '8:30', finishTime: '9:15', duration: '0:45', location: 'Auditorium' },
    { dateString: 'Wednesday 11th June', dateISO: '2025-06-11', subject: 'Biology Core', paper: '1', startTime: '8:30', finishTime: '9:15', duration: '0:45', location: 'Auditorium' }
];

// --- Helper Function to Get Base Subject Name ---
const getSubjectBaseName = (detailedSubjectName) => {
    if (!detailedSubjectName) return '';
    if (subjectOptions.includes(detailedSubjectName)) return detailedSubjectName;
    const baseName = detailedSubjectName
        .replace(/ Extended\/Core/i, '')
        .replace(/ Core and Extended/i, '')
        .replace(/ Extended/i, '')
        .replace(/ Core/i, '')
        .replace(/ Orals/i, '')
        .replace(/ - Listening/i, '')
        .replace(/ Paper \d+/i, '')
        .replace(/ \( Practical \)/i, '')
        .trim();
    if (subjectOptions.includes(baseName)) return baseName;
    const foundOption = subjectOptions.find(option => baseName.startsWith(option) || detailedSubjectName.startsWith(option));
    return foundOption || baseName;
};

// --- React Component ---
function App() {
    // --- State Variables ---
    const [subject, setSubject] = useState(subjectOptions[0]);
    const [rag, setRag] = useState('red');
    const [subjects, setSubjects] = useState(() => {
        const saved = localStorage.getItem(LS_KEYS.SUBJECTS);
        try { return saved ? (JSON.parse(saved) || []) : []; } catch { return []; }
    });
    const [day, setDay] = useState('Sunday'); // Default day set to Sunday
    const [startTime, setStartTime] = useState('16:00');
    const [endTime, setEndTime] = useState('17:00');
    const [slotType, setSlotType] = useState('revision'); // 'revision' or 'fixed_break'
    const [weeklyTimeSlots, setWeeklyTimeSlots] = useState(() => {
         const saved = localStorage.getItem(LS_KEYS.TIMESLOTS);
         try { return saved ? (JSON.parse(saved) || []) : []; } catch { return []; }
    });
    const defaultStartDate = '2025-04-20';
    const defaultEndDate = '2025-06-11';
    const [startDate, setStartDate] = useState(() => localStorage.getItem(LS_KEYS.START_DATE) || defaultStartDate);
    const [endDate, setEndDate] = useState(() => localStorage.getItem(LS_KEYS.END_DATE) || defaultEndDate);
    const [scheduleResult, setScheduleResult] = useState({ schedule: [], warnings: [] });
    const [isGenerating, setIsGenerating] = useState(false);

    // --- Effects to SAVE state ---
    useEffect(() => { localStorage.setItem(LS_KEYS.SUBJECTS, JSON.stringify(subjects)); }, [subjects]);
    useEffect(() => { localStorage.setItem(LS_KEYS.TIMESLOTS, JSON.stringify(weeklyTimeSlots)); }, [weeklyTimeSlots]);
    useEffect(() => { localStorage.setItem(LS_KEYS.START_DATE, startDate); }, [startDate]);
    useEffect(() => { localStorage.setItem(LS_KEYS.END_DATE, endDate); }, [endDate]);

    // --- Event Handlers ---
    const addSubject = () => {
        const baseSubjectName = getSubjectBaseName(subject);
        if (!baseSubjectName || subjects.find(s => s.name === baseSubjectName)) return;
        setSubjects(prev => [...prev, { name: baseSubjectName, rag }]);
    };
    const removeSubject = (indexToRemove) => {
        setSubjects(prev => prev.filter((_, index) => index !== indexToRemove));
    };
    const addTimeSlot = () => {
        const isValidTime = (time) => time && time.match(/^\d{2}:\d{2}$/);
        if (!isValidTime(startTime) || !isValidTime(endTime) || startTime >= endTime) {
             console.warn("Invalid time slot input."); return;
        }
        setWeeklyTimeSlots(prev => [...prev, { day, startTime, endTime, type: slotType }]);
    };
    const removeTimeSlot = (indexToRemove) => {
         setWeeklyTimeSlots(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    // --- Filter Exam Timetable ---
    const relevantExamTimetable = useMemo(() => {
        const selectedBaseNamesSet = new Set(subjects.map(s => s.name));
        return fullExamTimetable.filter(exam => {
            const examBaseName = getSubjectBaseName(exam.subject);
            return selectedBaseNamesSet.has(examBaseName);
        });
    }, [subjects]);

    // --- Schedule Generation Handler ---
    const handleGenerateSchedule = () => {
        if (subjects.length === 0 || weeklyTimeSlots.length === 0 || !startDate || !endDate) {
            setScheduleResult({ schedule: [], warnings: ["Please select subjects, add time slots, and set dates before generating."] }); return;
        }
        setIsGenerating(true); setScheduleResult({ schedule: [], warnings: [] });
        setTimeout(() => {
            try {
                const result = generateSchedule( subjects, weeklyTimeSlots, startDate, endDate, examDatesForPrioritisation, relevantExamTimetable );
                setScheduleResult(result);
            } catch (error) { console.error("Error generating schedule:", error); setScheduleResult({ schedule: [], warnings: ["An unexpected error occurred during schedule generation. Check console for details."] });
            } finally { setIsGenerating(false); }
        }, 50);
    };

    // --- Helper for Date Input ---
    const formatDateForInput = (dateStr) => {
        if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        try {
            const date = new Date(dateStr + 'T00:00:00'); if (isNaN(date)) return '';
            const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch { return ''; }
     };

    // --- JSX ---
    return (
        <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: 'auto' }}>
            <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ color: '#333' }}>📅 IGCSE Dynamic Revision Planner</h1>
            </header>

            <main style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) minmax(400px, 1.5fr)', gap: '2rem' }}>
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

                    {/* Step 2 Card: Subjects & Confidence */}
                    <div style={styles.card}>
                        <h2>Step 2: Subjects & Confidence</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{...styles.input, flexGrow: 2}}>
                                {subjectOptions.map((subj, index) => (<option key={index} value={subj}>{subj}</option>))}
                            </select>
                            <select value={rag} onChange={(e) => setRag(e.target.value)} style={styles.input}>
                                <option value="red">🔴 Red</option>
                                <option value="amber">🟠 Amber</option>
                                <option value="green">🟢 Green</option>
                            </select>
                            <button onClick={addSubject} style={styles.buttonPrimary}>Add</button>
                        </div>
                        <ul style={styles.list}>
                            {subjects.map((subj, index) => (
                                <li key={index} style={styles.listItem}>
                                    <span>{subj.name} ({subj.rag.toUpperCase()})</span>
                                    <button onClick={() => removeSubject(index)} style={styles.buttonDangerSmall} aria-label={`Remove ${subj.name}`}>X</button>
                                </li>
                            ))}
                        </ul>
                         {subjects.length === 0 && <p style={styles.infoTextSmall}>Add the subjects you need to revise.</p>}
                    </div>

                    {/* Step 3 Card: Weekly Availability */}
                    <div style={styles.card}>
                        <h2>Step 3: Weekly Availability</h2>
                        <p style={styles.infoTextSmall}>
                            Map out your typical weekly free time slots here. Select a day, the start and end time of an available period, and specify whether you'll use that time for 'Revision Time' or a 'Fixed Break' (like lunch). The planner will use these recurring weekly slots to build your schedule between your chosen start and end dates.
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
                        {weeklyTimeSlots.length === 0 && <p style={styles.infoTextSmall}>Add the times you are free each week for revision or fixed breaks.</p>}
                    </div>

                     {/* Step 4 Card: Generate Button */}
                     <div style={{ ...styles.card, textAlign: 'center', backgroundColor: '#e9f5ea' }}>
                        <h2>Step 4: Generate Schedule</h2>
                        <button
                            onClick={handleGenerateSchedule}
                            style={ (subjects.length === 0 || weeklyTimeSlots.length === 0 || !startDate || !endDate || isGenerating) ? styles.buttonSuccessLargeDisabled : styles.buttonSuccessLarge }
                            disabled={subjects.length === 0 || weeklyTimeSlots.length === 0 || !startDate || !endDate || isGenerating}
                        >
                            {isGenerating ? 'Generating...' : '✨ Generate My Revision Plan ✨'}
                        </button>
                        {isGenerating && <p style={styles.infoText}>Please wait, creating your personalised plan...</p>}
                        {(!isGenerating && (subjects.length === 0 || weeklyTimeSlots.length === 0 || !startDate || !endDate)) &&
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
                    {/* Generated Schedule Display */}
                    {(scheduleResult.schedule.length > 0 || scheduleResult.warnings.length > 0) && (
                        <div style={styles.card}>
                            <ScheduleDisplay
                                generatedSchedule={scheduleResult.schedule}
                                warnings={scheduleResult.warnings}
                                relevantExams={relevantExamTimetable} // Pass relevant exams here
                            />
                        </div>
                    )}

                     {/* Detailed Exam Timetable Display */}
                     <div style={styles.card}>
                         <ExamTimetableDisplay timetable={fullExamTimetable} />
                     </div>
                </section>
            </main>
        </div>
    );
}

// --- Basic Styling ---
const styles = {
    card: { marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#ffffff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
    inputGroup: { marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
    label: { minWidth: '80px', fontWeight: 'bold', flexShrink: 0 },
    input: { padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', flexGrow: 1, minWidth: '80px', fontSize: '0.9rem' }, // Keep flexGrow: 1
    buttonPrimary: { padding: '0.6rem 1rem', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.9rem', whiteSpace: 'nowrap' },
    buttonSuccessLarge: { padding: '0.8rem 1.5rem', fontSize: '1.1rem', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', opacity: 1, transition: 'opacity 0.3s ease, background-color 0.3s ease' },
    buttonSuccessLargeDisabled: { padding: '0.8rem 1.5rem', fontSize: '1.1rem', cursor: 'not-allowed', backgroundColor: '#cccccc', color: '#666666', border: 'none', borderRadius: '5px', opacity: 0.6 },
    buttonDangerSmall: { marginLeft: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.8rem', lineHeight: '1', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', flexShrink: 0 },
    list: { listStyle: 'none', paddingLeft: 0, marginTop: '1rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px' },
    listItem: { marginBottom: '0.5rem', padding: '0.5rem 0.8rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fdfdfd', },
    infoText: { marginTop: '1rem', fontStyle: 'italic', color: '#555' },
    infoTextSmall: { fontSize: '0.85rem', fontStyle: 'italic', color: '#777', marginTop: '0.5rem', marginBottom: '1rem' }, // Added margin-bottom
    slotTypeLabel: { marginLeft: '0.5rem', fontSize: '0.85em', fontStyle: 'italic', color: '#6c757d' }
};

export default App;
