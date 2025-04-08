// --- Helper Functions ---

// Format date string (YYYY-MM-DD)
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

// Add days to a date
const addDays = (date, days) => {
    // Ensure date is a valid Date object
    if (!(date instanceof Date) || isNaN(date)) {
        console.warn("Invalid date passed to addDays:", date);
        return new Date(); // Return current date as fallback
    }
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

// Get difference between two dates in days
const diffDays = (date1, date2) => {
    // Ensure dates are valid Date objects
     if (!(date1 instanceof Date) || isNaN(date1) || !(date2 instanceof Date) || isNaN(date2)) {
        console.warn("Invalid dates passed to diffDays:", date1, date2);
        return NaN; // Return Not-a-Number if dates are invalid
    }
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    // Discard time and timezone information for simple day difference
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    // Ensure results are numbers before calculation
    if (isNaN(utc1) || isNaN(utc2)) return NaN;
    return Math.floor((utc2 - utc1) / oneDay);
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


// Calculate duration between two HH:MM times in minutes
const calculateDuration = (startTime, endTime) => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    // Check if conversion was successful and end is after start
    if (isNaN(startMinutes) || isNaN(endMinutes) || endMinutes <= startMinutes) {
        return 0;
    }
    return endMinutes - startMinutes;
};

// Add minutes to a HH:MM time string
const addMinutesToTime = (timeString, minutesToAdd) => {
    const startMinutes = timeToMinutes(timeString);
    // Check if initial time conversion was successful
    if (isNaN(startMinutes)) return timeString; // Return original if invalid

    const totalMinutes = startMinutes + minutesToAdd;
    // Handle potential day rollover if needed, though less critical here
    const hours = Math.floor(totalMinutes / 60) % 24; // Keep within 24 hours
    const minutes = totalMinutes % 60;

    // Format back to HH:MM
    const newHours = String(hours).padStart(2, '0');
    const newMinutes = String(minutes).padStart(2, '0');
    return `${newHours}:${newMinutes}`;
};

// --- Overlap Check Helper ---
// Checks if two time intervals [start1, end1) and [start2, end2) overlap
// Assumes times are in minutes since midnight. Returns false if any input is NaN.
const doTimesOverlap = (start1, end1, start2, end2) => {
    // Ensure all inputs are valid numbers before comparison
    if (isNaN(start1) || isNaN(end1) || isNaN(start2) || isNaN(end2)) {
        return false; // Cannot overlap if times are invalid
    }
    // Check for non-overlapping conditions:
    // 1. Interval 1 ends before or exactly when Interval 2 starts
    // 2. Interval 1 starts after or exactly when Interval 2 ends
    // If neither is true, they must overlap. Use strict inequality for open intervals.
    return start1 < end2 && start2 < end1;
};


// --- Main Scheduling Function ---
// Accepts relevantExams parameter
export const generateSchedule = (
    subjects,
    weeklyTimeSlots, // Now includes { day, startTime, endTime, type: 'revision' | 'fixed_break' }
    startDateStr,
    endDateStr,
    examDates, // Map for prioritisation { subjectName: dateISO }
    relevantExams // Array of detailed exam objects for selected subjects [{ dateISO, startTime, finishTime, ... }]
) => {
    // --- Input Validation ---
    if (!subjects || subjects.length === 0) return { schedule: [], warnings: ["No subjects selected."] };
    if (!weeklyTimeSlots || weeklyTimeSlots.length === 0) return { schedule: [], warnings: ["No weekly time slots provided."] };
    if (!startDateStr || !endDateStr) return { schedule: [], warnings: ["Start or end date missing."] };

    let startDate, endDate;
    try {
        startDate = new Date(startDateStr + 'T00:00:00');
        endDate = new Date(endDateStr + 'T23:59:59');
        if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) throw new Error("Invalid date range.");
    } catch (e) { return { schedule: [], warnings: ["Invalid start or end date format or range."] }; }

    // --- Configuration ---
    const RAG_WEIGHTS = { red: 3, amber: 2, green: 1 };
    const STUDY_BLOCK_MINUTES = 40;
    const BREAK_MINUTES = 10;
    const EXAM_LEAD_IN_DAYS = 4;
    const EXAM_PRIORITY_BOOST = 10;

    // --- Prepare Subjects (for prioritisation) ---
    const validExamDates = typeof examDates === 'object' && examDates !== null ? examDates : {};
    const weightedSubjects = subjects.map(subj => {
        const examDateStr = validExamDates[subj.name];
        let examDateObj = null;
        if (examDateStr) {
            try {
                 examDateObj = new Date(examDateStr + 'T00:00:00');
                 if (isNaN(examDateObj)) examDateObj = null;
            } catch { examDateObj = null; }
        }
        return {
            ...subj,
            weight: typeof RAG_WEIGHTS[subj.rag] === 'number' ? RAG_WEIGHTS[subj.rag] : 1,
            examDate: examDateObj,
        };
     }).sort((a, b) => b.weight - a.weight);

    // --- Prepare Busy Intervals (Exams and Fixed Breaks) by Date ---
    const busyIntervalsByDate = {};
    const finalSchedule = []; // Initialize final schedule array
    // *** datedFixedBreaks DEFINED HERE ***
    const datedFixedBreaks = []; // Store dated fixed breaks separately first
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Iterate through each day in the range to find and process fixed breaks and exams
    let iterDate = new Date(startDate); // Use iterDate for this initial loop
    while (iterDate <= endDate) {
        const currentDateISO = formatDateISO(iterDate);
        const currentDayName = daysOfWeek[iterDate.getDay()];
        if (currentDateISO) {
            // Add Exams for the day to busy intervals
            (relevantExams || [])
                .filter(exam => exam.dateISO === currentDateISO)
                .forEach(exam => {
                    const startMins = timeToMinutes(exam.startTime);
                    const endMins = timeToMinutes(exam.finishTime);
                    if (!isNaN(startMins) && !isNaN(endMins) && endMins > startMins) {
                        if (!busyIntervalsByDate[currentDateISO]) busyIntervalsByDate[currentDateISO] = [];
                        busyIntervalsByDate[currentDateISO].push({ startMinutes: startMins, endMinutes: endMins, type: 'exam' });
                    }
                });

            // Add Fixed Breaks for the day to busy intervals AND datedFixedBreaks list
            weeklyTimeSlots
                .filter(slot => slot && slot.type === 'fixed_break' && slot.day === currentDayName)
                .forEach(slot => {
                    const startMins = timeToMinutes(slot.startTime);
                    const endMins = timeToMinutes(slot.endTime);
                    if (!isNaN(startMins) && !isNaN(endMins) && endMins > startMins) {
                        if (!busyIntervalsByDate[currentDateISO]) busyIntervalsByDate[currentDateISO] = [];
                        busyIntervalsByDate[currentDateISO].push({ startMinutes: startMins, endMinutes: endMins, type: 'fixed_break' });
                        // Add to temporary list
                        datedFixedBreaks.push({
                             date: currentDateISO, dayOfWeek: currentDayName,
                             startTime: slot.startTime, endTime: slot.endTime,
                             task: 'Fixed Break', type: 'break', displayType: 'break',
                             rag: null, duration: endMins - startMins, sortTime: startMins
                        });
                    }
                });
        }
        iterDate = addDays(iterDate, 1); // Move to the next day
    }

    // Sort busy intervals by start time for each day
    for (const date in busyIntervalsByDate) {
        busyIntervalsByDate[date].sort((a, b) => a.startMinutes - b.startMinutes);
    }

    // --- Generate All Available *Revision* Slots ---
    const revisionWeeklySlots = weeklyTimeSlots.filter(slot => slot.type !== 'fixed_break');
    const allDatedRevisionSlots = [];
    // *** currentDate DEFINED HERE for the revision slot generation loop ***
    let currentDate = new Date(startDate); // Reset currentDate for iteration

    while (currentDate <= endDate) { // Use currentDate in this loop
        const currentDayName = daysOfWeek[currentDate.getDay()];
        const currentDateISO = formatDateISO(currentDate);
        if (!currentDateISO) { currentDate = addDays(currentDate, 1); continue; } // Use currentDate

        revisionWeeklySlots
            .filter(slot => slot && slot.day === currentDayName && slot.startTime && slot.endTime)
            .forEach(slot => {
                const duration = calculateDuration(slot.startTime, slot.endTime);
                const startMins = timeToMinutes(slot.startTime);
                const endMins = timeToMinutes(slot.endTime);
                if (duration > 0 && !isNaN(startMins) && !isNaN(endMins)) {
                    allDatedRevisionSlots.push({
                        date: currentDateISO, dayOfWeek: currentDayName,
                        startTime: slot.startTime, endTime: slot.endTime, duration: duration,
                        startMinutes: startMins, endMinutes: endMins,
                        originalType: slot.type || 'revision'
                    });
                }
            });
        currentDate = addDays(currentDate, 1); // Use currentDate
    }

    // Sort revision slots chronologically
    allDatedRevisionSlots.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.startMinutes || 0) - (b.startMinutes || 0);
    });

    // --- Scheduling Algorithm (Filling Revision Slots) ---
    const dailyStudyTime = {};
    let subjectQueue = [...weightedSubjects];

    allDatedRevisionSlots.forEach(slot => {
        if (slot.originalType === 'fixed_break') return;
        let currentMins = slot.startMinutes;
        const slotEndMins = slot.endMinutes;
        if (isNaN(currentMins) || isNaN(slotEndMins)) return;
        let slotDate; try { slotDate = new Date(slot.date + 'T00:00:00'); if (isNaN(slotDate)) throw new Error("Invalid slot date"); } catch (e) { console.error("Skipping slot due to invalid date:", slot.date, e); return; }
        const todaysBusyIntervals = busyIntervalsByDate[slot.date] || [];

        while (currentMins < slotEndMins) {
            const potentialNextBlockEndMins = currentMins + BREAK_MINUTES;
            let conflictFound = false; let advanceToMins = currentMins;
            for (const busyInterval of todaysBusyIntervals) { if (currentMins >= busyInterval.startMinutes && currentMins < busyInterval.endMinutes) { conflictFound = true; advanceToMins = Math.max(advanceToMins, busyInterval.endMinutes); } else if (doTimesOverlap(currentMins, potentialNextBlockEndMins, busyInterval.startMinutes, busyInterval.endMinutes)) { conflictFound = true; advanceToMins = Math.max(advanceToMins, busyInterval.endMinutes); } }
            if (conflictFound) { currentMins = Math.min(advanceToMins, slotEndMins); continue; }

            if ((slotEndMins - currentMins) >= STUDY_BLOCK_MINUTES) {
                 const potentialStudyEndMins = currentMins + STUDY_BLOCK_MINUTES; let studyConflict = false; advanceToMins = currentMins;
                 for (const busyInterval of todaysBusyIntervals) { if (doTimesOverlap(currentMins, potentialStudyEndMins, busyInterval.startMinutes, busyInterval.endMinutes)) { studyConflict = true; advanceToMins = Math.max(advanceToMins, busyInterval.endMinutes); } }
                 if (studyConflict) { currentMins = Math.min(advanceToMins, slotEndMins); continue; }

                 if (subjectQueue.length === 0) subjectQueue = [...weightedSubjects]; if (subjectQueue.length === 0) break;
                 subjectQueue.sort((a, b) => { let wA = a.weight; let wB = b.weight; if (a.examDate instanceof Date && !isNaN(a.examDate) && a.examDate >= slotDate) { const dA = diffDays(slotDate, a.examDate); if (!isNaN(dA) && dA <= EXAM_LEAD_IN_DAYS) wA += EXAM_PRIORITY_BOOST; } if (b.examDate instanceof Date && !isNaN(b.examDate) && b.examDate >= slotDate) { const dB = diffDays(slotDate, b.examDate); if (!isNaN(dB) && dB <= EXAM_LEAD_IN_DAYS) wB += EXAM_PRIORITY_BOOST; } if (wB === wA) { const rO = { red: 3, amber: 2, green: 1 }; return (rO[b.rag] || 0) - (rO[a.rag] || 0); } return wB - wA; });
                 const currentSubject = subjectQueue.shift(); const studyStartTimeStr = addMinutesToTime("00:00", currentMins); const studyEndTimeStr = addMinutesToTime(studyStartTimeStr, STUDY_BLOCK_MINUTES); if (!studyStartTimeStr || !studyEndTimeStr || studyEndTimeStr === studyStartTimeStr) break;
                 finalSchedule.push({ date: slot.date, dayOfWeek: slot.dayOfWeek, startTime: studyStartTimeStr, endTime: studyEndTimeStr, task: currentSubject.name, type: 'study', displayType: 'study', rag: currentSubject.rag, duration: STUDY_BLOCK_MINUTES, sortTime: currentMins });
                 dailyStudyTime[slot.date] = (dailyStudyTime[slot.date] || 0) + STUDY_BLOCK_MINUTES; subjectQueue.push(currentSubject); currentMins += STUDY_BLOCK_MINUTES;

                 if ((slotEndMins - currentMins) >= BREAK_MINUTES) {
                     const potentialBreakEndMins = currentMins + BREAK_MINUTES; let breakConflict = false; advanceToMins = currentMins;
                     for (const busyInterval of todaysBusyIntervals) { if (doTimesOverlap(currentMins, potentialBreakEndMins, busyInterval.startMinutes, busyInterval.endMinutes)) { breakConflict = true; advanceToMins = Math.max(advanceToMins, busyInterval.endMinutes); } }
                     if (breakConflict) { currentMins = Math.min(advanceToMins, slotEndMins); continue; }
                     if (currentMins >= slotEndMins || (slotEndMins - currentMins) < BREAK_MINUTES) break;
                     const breakStartTimeStr = addMinutesToTime("00:00", currentMins); const breakEndTimeStr = addMinutesToTime(breakStartTimeStr, BREAK_MINUTES); if (!breakStartTimeStr || !breakEndTimeStr || breakEndTimeStr === breakStartTimeStr) break;
                     finalSchedule.push({ date: slot.date, dayOfWeek: slot.dayOfWeek, startTime: breakStartTimeStr, endTime: breakEndTimeStr, task: 'Break', type: 'break', displayType: 'break', rag: null, duration: BREAK_MINUTES, sortTime: currentMins }); currentMins += BREAK_MINUTES;
                 } else { break; }
             } else { break; }
        }
    });

    // --- Combine fixed breaks with generated schedule ---
    // Add the pre-defined fixed breaks back into the schedule
    // *** datedFixedBreaks USED HERE ***
    finalSchedule.push(...datedFixedBreaks);

    // --- Generate Warnings ---
    const warnings = [];
    // *** datedFixedBreaks USED HERE ***
    if (finalSchedule.length === datedFixedBreaks.length && allDatedRevisionSlots.length > 0) {
         warnings.push("Could not schedule any revision blocks. Check for conflicts with exams/fixed breaks or insufficient time in revision slots.");
    // *** datedFixedBreaks USED HERE ***
    } else if (finalSchedule.length === 0 && allDatedRevisionSlots.length === 0 && datedFixedBreaks.length === 0) {
         warnings.push("Could not schedule anything. Check inputs, date range, and availability.");
    }

    // Sorting is handled in ScheduleDisplay component based on sortTime.
    return { schedule: finalSchedule, warnings };
};



