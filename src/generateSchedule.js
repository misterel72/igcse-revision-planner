// --- Helper Functions ---

/**
 * Formats a Date object into a YYYY-MM-DD string.
 * Returns null if the input is not a valid Date.
 * @param {Date} date - The Date object to format.
 * @returns {string|null} The formatted date string or null.
 */
const formatDateISO = (date) => {
    // Ensure date is a valid Date object
    if (!(date instanceof Date) || isNaN(date)) {
        // console.warn("Invalid date passed to formatDateISO:", date); // Reduce console noise
        return null; // Return null for invalid dates
    }
    try {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.error("Error formatting date:", date, e);
        return null;
    }
};

/**
 * Adds a specified number of days to a Date object.
 * Returns a new Date object. Returns current date if input is invalid.
 * @param {Date} date - The starting Date object.
 * @param {number} days - The number of days to add.
 * @returns {Date} The new Date object.
 */
const addDays = (date, days) => {
    // Ensure date is a valid Date object
    if (!(date instanceof Date) || isNaN(date)) {
        console.warn("Invalid date passed to addDays:", date);
        return new Date(); // Return current date as fallback, consider null or error
    }
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

/**
 * Calculates the difference between two Date objects in whole days.
 * Returns NaN if either input is not a valid Date.
 * @param {Date} date1 - The first Date object.
 * @param {Date} date2 - The second Date object.
 * @returns {number|NaN} The difference in days (date2 - date1).
 */
const diffDays = (date1, date2) => {
     // Ensure dates are valid Date objects
     if (!(date1 instanceof Date) || isNaN(date1) || !(date2 instanceof Date) || isNaN(date2)) {
        // console.warn("Invalid dates passed to diffDays:", date1, date2); // Reduce console noise
        return NaN; // Return Not-a-Number if dates are invalid
    }
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
    // Use UTC dates to avoid potential DST issues in difference calculation
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    // Ensure results are numbers before calculation
    if (isNaN(utc1) || isNaN(utc2)) return NaN;
    return Math.floor((utc2 - utc1) / oneDay);
};

/**
 * Converts an HH:MM time string to minutes since midnight.
 * Returns NaN for invalid formats, null/undefined, or the string "various".
 * @param {string|null|undefined} timeString - The time string to convert.
 * @returns {number|NaN} Minutes since midnight or NaN.
 */
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


/**
 * Calculates the duration between two HH:MM time strings in minutes.
 * Returns 0 if times are invalid or end time is not after start time.
 * @param {string} startTime - The start time string (HH:MM).
 * @param {string} endTime - The end time string (HH:MM).
 * @returns {number} Duration in minutes.
 */
const calculateDuration = (startTime, endTime) => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    // Check if conversion was successful and end is after start
    if (isNaN(startMinutes) || isNaN(endMinutes) || endMinutes <= startMinutes) {
        return 0;
    }
    return endMinutes - startMinutes;
};

/**
 * Adds a specified number of minutes to an HH:MM time string.
 * Returns the original string if the input time is invalid.
 * Handles wrapping past midnight correctly within a 24-hour cycle.
 * @param {string} timeString - The starting time string (HH:MM).
 * @param {number} minutesToAdd - The number of minutes to add.
 * @returns {string} The resulting time string (HH:MM).
 */
const addMinutesToTime = (timeString, minutesToAdd) => {
    const startMinutes = timeToMinutes(timeString);
    // Check if initial time conversion was successful
    if (isNaN(startMinutes)) return timeString;

    const totalMinutes = startMinutes + minutesToAdd;
    // Calculate new hours (0-23) and minutes (0-59)
    const newMinutesPart = totalMinutes % 60;
    // Keep hours within 0-23 range for a 24-hour clock representation
    const newHoursPart = Math.floor(totalMinutes / 60) % 24;

    // Format back to HH:MM with leading zeros
    const newHours = String(newHoursPart).padStart(2, '0');
    const newMinutes = String(newMinutesPart).padStart(2, '0');
    return `${newHours}:${newMinutes}`;
};

/**
 * Checks if two time intervals [start1, end1) and [start2, end2) overlap.
 * Assumes times are in minutes since midnight. Returns false if any input is NaN.
 * Intervals are treated as [inclusive, exclusive).
 * @param {number} start1 - Start minutes of interval 1.
 * @param {number} end1 - End minutes of interval 1.
 * @param {number} start2 - Start minutes of interval 2.
 * @param {number} end2 - End minutes of interval 2.
 * @returns {boolean} True if the intervals overlap, false otherwise.
 */
const doTimesOverlap = (start1, end1, start2, end2) => {
    if (isNaN(start1) || isNaN(end1) || isNaN(start2) || isNaN(end2)) return false;
    // Overlap exists if interval 1 starts before interval 2 ends
    // AND interval 2 starts before interval 1 ends.
    return start1 < end2 && start2 < end1;
};


// --- Main Scheduling Function (Refactored) ---
/**
 * Generates a revision schedule based on user inputs.
 * @param {Array} plannerEntries - Array of objects representing subjects/papers/topics to revise.
 * @param {Array} weeklyTimeSlots - Array of objects defining user's weekly availability and fixed breaks.
 * @param {string} startDateStr - Start date for the schedule (YYYY-MM-DD).
 * @param {string} endDateStr - End date for the schedule (YYYY-MM-DD).
 * @returns {{schedule: Array, warnings: Array}} Object containing the generated schedule array and any warnings.
 */
export const generateSchedule = (
    plannerEntries,
    weeklyTimeSlots,
    startDateStr,
    endDateStr
) => {
    // --- Input Validation ---
    if (!plannerEntries || plannerEntries.length === 0) return { schedule: [], warnings: ["No subjects/papers added."] };
    if (!weeklyTimeSlots || weeklyTimeSlots.length === 0) return { schedule: [], warnings: ["No weekly time slots provided."] };
    if (!startDateStr || !endDateStr) return { schedule: [], warnings: ["Start or end date missing."] };

    let startDate, endDate;
    try {
        startDate = new Date(startDateStr + 'T00:00:00'); // Treat as start of local day
        endDate = new Date(endDateStr + 'T23:59:59');   // Treat as end of local day
        if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) throw new Error("Invalid date range.");
    } catch (e) { return { schedule: [], warnings: ["Invalid start or end date format or range."] }; }

    // --- Configuration ---
    const RAG_WEIGHTS = { red: 3, amber: 2, green: 1 };
    const STUDY_BLOCK_MINUTES = 40;
    const BREAK_MINUTES = 10;
    const EXAM_LEAD_IN_DAYS = 4; // How many days before exam boost starts (inclusive)
    // No fixed boost factor needed for round-robin approach

    // --- Prepare Planner Entries (for prioritisation queue) ---
    // Add parsed exam date (as Date object or null) to each entry
    // No initial weighting needed here as sorting happens dynamically
    const revisionEntries = plannerEntries.map(entry => {
        let examDateObj = null;
        if (entry.examDetails && entry.examDetails.date && typeof entry.examDetails.date === 'string') {
            try { examDateObj = new Date(entry.examDetails.date + 'T00:00:00'); if (isNaN(examDateObj)) examDateObj = null; } catch { examDateObj = null; }
        }
        // Keep original RAG for tie-breaking if needed
        return { ...entry, examDate: examDateObj };
    });

    // --- Prepare Busy Intervals (Exams and Fixed Breaks) by Date ---
    const busyIntervalsByDate = {}; // Object to store busy intervals keyed by dateISO
    const finalSchedule = []; // Initialize final schedule array
    const datedFixedBreaks = []; // Store dated fixed breaks separately before adding
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; // Sunday first

    // Iterate through each day in the specified date range to identify all busy periods
    let iterDate = new Date(startDate);
    while (iterDate <= endDate) {
        const currentDateISO = formatDateISO(iterDate);
        const currentDayName = daysOfWeek[iterDate.getDay()];
        if (currentDateISO) { // Proceed only if date formatting was successful
            // Add Exams for the current day from plannerEntries to busy intervals
            plannerEntries
                .filter(entry => entry.examDetails && entry.examDetails.date === currentDateISO) // Find entries with exams on this date
                .forEach(entry => {
                    const startMins = timeToMinutes(entry.examDetails.startTime);
                    const endMins = timeToMinutes(entry.examDetails.finishTime);
                    // Add to busy intervals only if times are valid and form a valid range
                    if (!isNaN(startMins) && !isNaN(endMins) && endMins > startMins) {
                        if (!busyIntervalsByDate[currentDateISO]) busyIntervalsByDate[currentDateISO] = [];
                        busyIntervalsByDate[currentDateISO].push({ startMinutes: startMins, endMinutes: endMins, type: 'exam' });
                    }
                });

            // Add Fixed Breaks for the current day from weeklyTimeSlots
            weeklyTimeSlots
                .filter(slot => slot && slot.type === 'fixed_break' && slot.day === currentDayName) // Find fixed break slots for this day of the week
                .forEach(slot => {
                    const startMins = timeToMinutes(slot.startTime);
                    const endMins = timeToMinutes(slot.endTime);
                     // Add to busy intervals and pre-schedule list if times are valid
                    if (!isNaN(startMins) && !isNaN(endMins) && endMins > startMins) {
                        if (!busyIntervalsByDate[currentDateISO]) busyIntervalsByDate[currentDateISO] = [];
                        busyIntervalsByDate[currentDateISO].push({ startMinutes: startMins, endMinutes: endMins, type: 'fixed_break' });
                        // Add directly to temporary list for final schedule
                        datedFixedBreaks.push({
                             date: currentDateISO, dayOfWeek: currentDayName,
                             startTime: slot.startTime, endTime: slot.endTime,
                             task: 'Fixed Break', // Label it clearly
                             type: 'break', // Use 'break' type for display consistency
                             displayType: 'break', // Or 'fixed_break' if specific styling needed
                             rag: null, duration: endMins - startMins,
                             sortTime: startMins // Add sortTime for potential later sorting
                        });
                    }
                });
        }
        iterDate = addDays(iterDate, 1); // Move to the next day
    }

    // Sort busy intervals by start time for each day (important for efficient checking)
    for (const date in busyIntervalsByDate) {
        busyIntervalsByDate[date].sort((a, b) => a.startMinutes - b.startMinutes);
    }

    // --- Generate All Available *Revision* Slots ---
    // Filter the user's weekly availability to get only slots marked for revision
    const revisionWeeklySlots = weeklyTimeSlots.filter(slot => slot.type !== 'fixed_break');
    const allDatedRevisionSlots = []; // Array to hold specific dated slots available for revision
    let currentDate = new Date(startDate); // Initialize currentDate for this iteration

    while (currentDate <= endDate) { // Use currentDate in this loop
        const currentDayName = daysOfWeek[currentDate.getDay()];
        const currentDateISO = formatDateISO(currentDate);
        if (!currentDateISO) { currentDate = addDays(currentDate, 1); continue; } // Skip if date formatting failed

        // Find matching revision slots for the current day of the week
        revisionWeeklySlots
            .filter(slot => slot && slot.day === currentDayName && slot.startTime && slot.endTime)
            .forEach(slot => {
                const duration = calculateDuration(slot.startTime, slot.endTime);
                const startMins = timeToMinutes(slot.startTime);
                const endMins = timeToMinutes(slot.endTime);
                // Add slot if duration and times are valid
                if (duration > 0 && !isNaN(startMins) && !isNaN(endMins)) {
                    allDatedRevisionSlots.push({
                        date: currentDateISO, dayOfWeek: currentDayName,
                        startTime: slot.startTime, endTime: slot.endTime, duration: duration,
                        startMinutes: startMins, // Store start/end minutes for the slot
                        endMinutes: endMins,
                        originalType: slot.type || 'revision' // Keep track of original type (should be 'revision')
                    });
                }
            });
        currentDate = addDays(currentDate, 1); // Increment the correct currentDate
    }

    // Sort all potential revision slots chronologically
    allDatedRevisionSlots.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.startMinutes || 0) - (b.startMinutes || 0);
    });

    // --- Scheduling Algorithm (Filling Revision Slots) ---
    const dailyStudyTime = {}; // Track study time per day
    // Keep track of the index for round-robin within the lead-in group ACROSS ALL SLOTS
    let leadInCycleIndex = 0;

    // Iterate through each available revision slot
    allDatedRevisionSlots.forEach(slot => {
        // Double check it's not a fixed break (should be filtered already)
        if (slot.originalType === 'fixed_break') return;

        let currentMins = slot.startMinutes; // Current time marker within the slot, in minutes
        const slotEndMins = slot.endMinutes; // End time of the slot, in minutes
        if (isNaN(currentMins) || isNaN(slotEndMins)) return; // Skip if slot times are invalid

        let slotDate; // Date object for the current slot
        try {
            slotDate = new Date(slot.date + 'T00:00:00'); // Treat as local start of day
            if (isNaN(slotDate)) throw new Error("Invalid slot date");
        } catch (e) {
            console.error("Skipping slot due to invalid date:", slot.date, e);
            return; // Skip processing this slot if date is invalid
        }

        // Get the pre-calculated busy intervals (Exams + Fixed Breaks) for this specific day
        const todaysBusyIntervals = busyIntervalsByDate[slot.date] || [];

        // --- Try to fill the current revision slot with study/break blocks ---
        while (currentMins < slotEndMins) {
            // --- Check for Overlap with ALL Busy Intervals ---
            const potentialNextBlockEndMins = currentMins + BREAK_MINUTES; // Check smallest possible block
            let conflictFound = false;
            let advanceToMins = currentMins; // Time to advance to if conflict found

            for (const busyInterval of todaysBusyIntervals) {
                // If current time is already inside a busy interval
                if (currentMins >= busyInterval.startMinutes && currentMins < busyInterval.endMinutes) {
                     conflictFound = true;
                     advanceToMins = Math.max(advanceToMins, busyInterval.endMinutes);
                }
                // If the next potential block overlaps a busy interval
                else if (doTimesOverlap(currentMins, potentialNextBlockEndMins, busyInterval.startMinutes, busyInterval.endMinutes)) {
                    conflictFound = true;
                    advanceToMins = Math.max(advanceToMins, busyInterval.endMinutes);
                }
                // Note: We check all busy intervals to find the latest end time among conflicts
            }

            // If a conflict was found, advance time and restart the check for the new time
            if (conflictFound) {
                currentMins = Math.min(advanceToMins, slotEndMins); // Advance, but not beyond the slot end
                // No need to reset lastScheduledEntryId here as we are just skipping time
                continue; // Go to next iteration of the while loop
            }

            // --- If no conflict for a minimal block, check if a full STUDY block fits ---
             if ((slotEndMins - currentMins) >= STUDY_BLOCK_MINUTES) {
                 // Now check specifically for the study block duration against busy intervals
                 const potentialStudyEndMins = currentMins + STUDY_BLOCK_MINUTES;
                 let studyConflict = false;
                 advanceToMins = currentMins; // Reset advance time for this specific check
                 for (const busyInterval of todaysBusyIntervals) {
                     if (doTimesOverlap(currentMins, potentialStudyEndMins, busyInterval.startMinutes, busyInterval.endMinutes)) {
                         studyConflict = true;
                         advanceToMins = Math.max(advanceToMins, busyInterval.endMinutes);
                         // Don't break; check all busy intervals for the study block duration
                     }
                 }
                 // If study block conflicts, advance time and restart the while loop
                 if (studyConflict) {
                     currentMins = Math.min(advanceToMins, slotEndMins);
                     // No need to reset lastScheduledEntryId here
                     continue;
                 }

                 // --- Select Subject/Paper to Revise ---

                 // 1. Filter available entries: remove those whose exams are done for this slotDate
                 // Use the initial full list of entries for filtering each time
                 let validEntriesForSlot = revisionEntries.filter(entry =>
                     !(entry.examDate instanceof Date && !isNaN(entry.examDate) && slotDate >= entry.examDate) // Use >=
                 );

                 if (validEntriesForSlot.length === 0) {
                     // console.log(`No valid (non-exam-done) entries left for slot at ${slot.date}`); // Debug
                     break; // No valid subjects left to schedule in this slot
                 }

                 // 2. Identify entries within the lead-in period from the valid list
                 const leadInEntries = validEntriesForSlot.filter(entry =>
                     entry.examDate instanceof Date && !isNaN(entry.examDate) && entry.examDate >= slotDate && diffDays(slotDate, entry.examDate) <= EXAM_LEAD_IN_DAYS
                 );

                 let entryToSchedule = null;

                 // 3. If there are subjects in the lead-in period, use round-robin on them
                 if (leadInEntries.length > 0) {
                     // Sort lead-in entries by RAG as a tie-breaker within the round-robin cycle
                     leadInEntries.sort((a, b) => (RAG_WEIGHTS[b.rag] || 0) - (RAG_WEIGHTS[a.rag] || 0));
                     // Select using the cycle index, ensuring it wraps around
                     if (leadInCycleIndex >= leadInEntries.length) {
                         leadInCycleIndex = 0; // Wrap index back to 0
                     }
                     entryToSchedule = leadInEntries[leadInCycleIndex];
                     leadInCycleIndex++; // Increment for next time a lead-in subject is chosen
                 }
                 // 4. Otherwise (no subjects in lead-in), use standard RAG prioritisation on remaining valid entries
                 else {
                     // Sort the remaining valid entries by RAG weight only
                     validEntriesForSlot.sort((a, b) => (RAG_WEIGHTS[b.rag] || 0) - (RAG_WEIGHTS[a.rag] || 0));
                     entryToSchedule = validEntriesForSlot[0]; // Pick the highest RAG
                     // Don't reset leadInCycleIndex here, let it continue when lead-in becomes active again
                 }

                 // Safety check if somehow no entry was selected
                 if (!entryToSchedule) {
                     // This might happen if all valid subjects are filtered out by some logic upstream
                     // Or if validEntriesForSlot was empty initially (handled above)
                     console.warn(`Could not select an entry to schedule at ${slot.date} ${addMinutesToTime("00:00", currentMins)}`);
                     break; // Cannot proceed without an entry
                 }

                 // --- Schedule Study Block ---
                 const currentEntry = entryToSchedule; // Use the selected entry
                 const studyStartTimeStr = addMinutesToTime("00:00", currentMins);
                 const studyEndTimeStr = addMinutesToTime(studyStartTimeStr, STUDY_BLOCK_MINUTES);
                 if (!studyStartTimeStr || !studyEndTimeStr || studyEndTimeStr === studyStartTimeStr) break; // Safety check

                 // Use Subject Name + Paper/Topic for the task description
                 const taskDescription = `Revise: ${currentEntry.subjectName} - ${currentEntry.paperOrTopic}`;

                 // Add study block to the schedule
                 finalSchedule.push({
                     date: slot.date, dayOfWeek: slot.dayOfWeek,
                     startTime: studyStartTimeStr, endTime: studyEndTimeStr,
                     task: taskDescription, // Use combined description
                     type: 'study', displayType: 'study', rag: currentEntry.rag, // Use RAG from the entry
                     duration: STUDY_BLOCK_MINUTES, sortTime: currentMins
                 });
                 // Update daily study time tracker
                 dailyStudyTime[slot.date] = (dailyStudyTime[slot.date] || 0) + STUDY_BLOCK_MINUTES;
                 // We don't manipulate the main availableRevisionEntries queue here anymore
                 currentMins += STUDY_BLOCK_MINUTES; // Advance time

                 // --- Schedule Short Break (if enough time and no conflict) ---
                 if ((slotEndMins - currentMins) >= BREAK_MINUTES) {
                     const potentialBreakEndMins = currentMins + BREAK_MINUTES; let breakConflict = false; advanceToMins = currentMins;
                     // Check for overlap with busy intervals
                     for (const busyInterval of todaysBusyIntervals) { if (doTimesOverlap(currentMins, potentialBreakEndMins, busyInterval.startMinutes, busyInterval.endMinutes)) { breakConflict = true; advanceToMins = Math.max(advanceToMins, busyInterval.endMinutes); } }
                     if (breakConflict) { currentMins = Math.min(advanceToMins, slotEndMins); continue; } // Conflict found, advance time

                     // Schedule break if no conflict
                     // Check time again after potential advancement
                     if (currentMins >= slotEndMins || (slotEndMins - currentMins) < BREAK_MINUTES) break; // Not enough time left

                     const breakStartTimeStr = addMinutesToTime("00:00", currentMins);
                     const breakEndTimeStr = addMinutesToTime(breakStartTimeStr, BREAK_MINUTES);
                     if (!breakStartTimeStr || !breakEndTimeStr || breakEndTimeStr === breakStartTimeStr) break; // Safety check
                     finalSchedule.push({ date: slot.date, dayOfWeek: slot.dayOfWeek, startTime: breakStartTimeStr, endTime: breakEndTimeStr, task: 'Break', type: 'break', displayType: 'break', rag: null, duration: BREAK_MINUTES, sortTime: currentMins });
                     currentMins += BREAK_MINUTES; // Advance time
                 } else {
                      break; // Not enough time left for a break after the study block
                 }

             } else {
                 // Not enough time for a full study block, break the inner loop for this slot
                 break;
             }
        } // End while loop for processing current slot
    }); // End forEach revision slot

    // --- Combine fixed breaks with generated schedule ---
    // Add the pre-defined fixed breaks back into the main schedule array
    finalSchedule.push(...datedFixedBreaks);

    // --- Generate Warnings ---
    const warnings = [];
    // Check if only fixed breaks were scheduled despite revision slots existing
    const studyBlockCount = finalSchedule.filter(item => item.type === 'study').length;
    if (studyBlockCount === 0 && datedFixedBreaks.length < finalSchedule.length && allDatedRevisionSlots.length > 0) {
         warnings.push("Could not schedule any revision blocks. Check for conflicts with exams/fixed breaks or insufficient time in revision slots.");
    }
    // Check if absolutely nothing was scheduled
    else if (finalSchedule.length === 0) { // Simplified check: if final schedule is empty
         warnings.push("Could not schedule anything. Check inputs, date range, and availability.");
    }

    // Final sorting by date and time will be handled by the ScheduleDisplay component.
    return { schedule: finalSchedule, warnings };
};










