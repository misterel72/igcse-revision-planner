import React, { useState } from 'react';

// Component to display wellbeing and revision tips using an accordion
function WellbeingTips() {
    // State to keep track of which sections are open
    const [openSections, setOpenSections] = useState({});

    // Function to toggle the open/closed state of a section
    const toggleSection = (title) => {
        setOpenSections(prevOpenSections => ({
            ...prevOpenSections,
            [title]: !prevOpenSections[title] // Toggle the state of the clicked section
        }));
    };

    // Define the content sections (including the new links section)
    const sections = [
        {
            title: "Planning Your Revision",
            content: (
                <ul>
                    <li><strong>Timetable:</strong> Create a realistic schedule using a planner or calendar app. Block out commitments and break times first.</li>
                    <li><strong>Short Bursts:</strong> Allocate revision time in focused chunks (e.g., 30-50 minutes) followed by short breaks (e.g., 10 minutes).</li>
                    <li><strong>Prioritise:</strong> Use RAG rating (Red, Amber, Green) for topics to identify areas needing most attention. Focus on Red first, then Amber.</li>
                    <li><strong>Avoid Cramming:</strong> Spread revision over time.</li>
                </ul>
            )
        },
        {
            title: "Effective Revision Techniques",
            content: (
                 <ul>
                    <li><strong>Mind Mapping:</strong> Visually organise topics with branches for themes, facts, ideas. Use colours/images.</li>
                    <li><strong>Teach Someone:</strong> Explain topics aloud to check understanding.</li>
                    <li><strong>Dual Coding:</strong> Combine words with visuals (diagrams, timelines, charts).</li>
                    <li><strong>Retrieval Practice:</strong> Actively recall information without notes (self-testing, practice questions).</li>
                    <li><strong>Flashcards:</strong> Quick testing of keywords, definitions, dates, formulae.</li>
                    <li><strong>Past Papers & Examiner Notes:</strong> Practise and understand common mistakes.</li>
                    <li><strong>Spaced Practice:</strong> Revisit topics periodically over time.</li>
                    <li><strong>Interleaving:</strong> Switch between different topics/subjects in a session.</li>
                </ul>
            )
        },
        {
            title: "Time Management",
            content: (
                 <ul>
                    <li><strong>Pomodoro Technique:</strong> Work 40 mins, 10 min break. Repeat x3-4, then longer break.</li>
                    <li><strong>Use a Timer:</strong> Maintain focus during study blocks and ensure breaks. Minimise distractions.</li>
                    <li><strong>Eisenhower Matrix:</strong> Prioritise tasks based on Urgency & Importance (Do, Schedule, Delegate, Avoid).</li>
                </ul>
            )
        },
         {
            title: "Staying Motivated",
            content: (
                <ul>
                    <li><strong>Set SMART Goals:</strong> Specific, Measurable, Achievable, Relevant, Time-Bound.</li>
                    <li><strong>Reward Yourself:</strong> Acknowledge completed tasks with small rewards.</li>
                    <li><strong>Track Progress:</strong> Use a visual tracker to see accomplishments.</li>
                    <li><strong>Variety:</strong> Mix up revision techniques and subjects.</li>
                </ul>
            )
        },
         {
            title: "Managing Exam Stress & Worry",
            content: (
                 <ul>
                    <li><strong>Recognise Feelings:</strong> Acknowledge worries are normal. Write them down.</li>
                    <li><strong>Action Planning:</strong> For each worry, write a small, concrete action.</li>
                    <li><strong>Ask for Help:</strong> Talk to teachers, parents, friends, counsellors.</li>
                    <li><strong>Find Balance:</strong> Schedule time for rest, hobbies, enjoyment.</li>
                    <li><strong>Take Breaks:</strong> Short, regular breaks are essential. Move around.</li>
                    <li><strong>Prioritise Sleep:</strong> Aim for 8-10 hours nightly; maintain a routine.</li>
                    <li><strong>Breathing Exercises:</strong> Use simple deep breathing (4-4-4 count) to calm nerves.</li>
                    <li><strong>Flip Your Thinking:</strong> Challenge negative thoughts with realistic ones.</li>
                    <li><strong>Get Moving:</strong> Physical activity helps release stress.</li>
                    <li><strong>Worry Time:</strong> Designate a short time daily to acknowledge worries.</li>
                    <li><strong>Look After Yourself:</strong> Eat well, drink water, sleep, take breaks.</li>
                </ul>
            )
        },
         {
            title: "Overcoming Procrastination",
            content: (
                <ul>
                    <li><strong>The 5-Minute Rule:</strong> Commit to starting for just 5 minutes.</li>
                    <li><strong>Break It Down:</strong> Divide large tasks into smaller steps.</li>
                    <li><strong>Limit Distractions:</strong> Create a focused environment.</li>
                    <li><strong>Visualise Success:</strong> Imagine the positive feeling of being prepared.</li>
                 </ul>
            )
        },
        // --- Section for Links ---
        {
            title: "Useful Online Resources",
            content: (
                <ul>
                    <li style={styles.linkItem}>
                        {/* *** UPDATED LINK TEXT BELOW *** */}
                        <a href="https://www.bbc.co.uk/bitesize/levels/z98jmp3" target="_blank" rel="noopener noreferrer" style={styles.link}>
                            BBC Bitesize (GCSE/Relevant for IGCSE)
                        </a> - Comprehensive notes, videos, and quizzes for most subjects. Excellent study skills section too. (Check your specific IGCSE syllabus for exact topic alignment).
                    </li>
                     <li style={styles.linkItem}>
                        <a href="https://senecalearning.com/en-GB/" target="_blank" rel="noopener noreferrer" style={styles.link}>
                            Seneca Learning
                        </a> - Free interactive courses using smart learning techniques (requires sign-up).
                    </li>
                    <li style={styles.linkItem}>
                        <a href="https://www.childline.org.uk/info-advice/school-college-and-work/school-college/exam-stress/" target="_blank" rel="noopener noreferrer" style={styles.link}>
                            Childline - Exam Stress
                        </a> - Advice and support for managing exam pressure and anxiety.
                    </li>
                     <li style={styles.linkItem}>
                        <a href="https://www.youngminds.org.uk/young-person/coping-with-life/exam-stress/" target="_blank" rel="noopener noreferrer" style={styles.link}>
                            YoungMinds - Exam Stress
                        </a> - Mental health charity with practical tips for students facing exams.
                    </li>
                    <li style={styles.linkItem}>
                        <a href="https://getrevising.co.uk/" target="_blank" rel="noopener noreferrer" style={styles.link}>
                            Get Revising
                        </a> - Tools like study planners, timetables, flashcards, mind maps, and quizzes (mix of free/paid features).
                    </li>
                </ul>
            )
        }
    ];

    return (
        <section>
            {/* Main heading for the component */}
            <h2 style={{ borderBottom: '2px solid #ffc107', paddingBottom: '0.5rem', marginBottom: '1rem' }}>💡 Wellbeing & Revision Tips</h2>

            {/* Map over the sections defined above */}
            {sections.map((section, index) => (
                <div key={index} style={styles.accordionItem}>
                    {/* Clickable header for each section */}
                    <button
                        onClick={() => toggleSection(section.title)}
                        style={styles.accordionHeader}
                        aria-expanded={!!openSections[section.title]} // Accessibility attribute
                        aria-controls={`section-content-${index}`} // Accessibility attribute
                    >
                        {/* Display open/closed indicator */}
                        <span style={styles.indicator}>
                            {openSections[section.title] ? '[-] ' : '[+] '}
                        </span>
                        {/* Section title */}
                        {section.title}
                    </button>
                    {/* Conditionally render the content if the section is open */}
                    {openSections[section.title] && (
                        <div id={`section-content-${index}`} style={styles.accordionContent}>
                            {section.content}
                        </div>
                    )}
                </div>
            ))}
        </section>
    );
}

// --- Basic Styling ---
const styles = {
    accordionItem: {
        marginBottom: '0.5rem', // Space between accordion items
        border: '1px solid #eee',
        borderRadius: '4px',
        overflow: 'hidden' // Ensures content stays within rounded corners
    },
    accordionHeader: {
        width: '100%',
        padding: '0.8rem 1rem',
        textAlign: 'left',
        cursor: 'pointer',
        border: 'none', // Remove default button border
        borderBottom: '1px solid #eee', // Separator line when closed
        backgroundColor: '#f8f9fa', // Light background for header
        fontSize: '1.1em', // Slightly larger font for header
        fontWeight: 'bold',
        display: 'flex', // Use flex for indicator alignment
        alignItems: 'center'
    },
    indicator: {
        marginRight: '0.5rem', // Space between indicator and title
        minWidth: '20px', // Ensure space for indicator
        display: 'inline-block'
    },
    accordionContent: {
        padding: '1rem 1.5rem', // Padding for the content area
        borderTop: '1px solid #eee', // Separator line when open
        backgroundColor: '#fff' // White background for content
    },
    linkItem: {
        marginBottom: '0.8rem', // Space between links
        lineHeight: '1.4'
    },
    link: {
        fontWeight: 'bold',
        color: '#0056b3', // Standard link blue
        textDecoration: 'none' // Remove underline by default
    },
    // Add hover effect if desired
    // linkHover: {
    //     textDecoration: 'underline'
    // }
};

export default WellbeingTips;
