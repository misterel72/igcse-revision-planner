import React, { useState } from 'react';

// --- List View Sub-Component ---
const ListView = ({ schedule }) => (
  <ul style={{ listStyleType: 'none', padding: 0, marginTop: '1rem' }}>
    {schedule.map((item, index) => (
      <li key={index} style={{ marginBottom: '0.6rem', padding: '0.8rem', border: '1px solid #eee', borderRadius: '4px', backgroundColor: item.type === 'break' ? '#f8f9fa' : '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <strong style={{ display: 'block', marginBottom: '0.3rem' }}>{item.day}, {item.startTime} - {item.endTime} ({item.duration} mins)</strong>
        {item.type === 'study' ? (
          <>
            Subject: {item.task}{' '}
            <span style={{
                padding: '0.2em 0.4em',
                fontSize: '0.8em',
                fontWeight: 'bold',
                borderRadius: '3px',
                color: 'white',
                backgroundColor: item.rag === 'red' ? '#dc3545' : item.rag === 'amber' ? '#ffc107' : '#28a745'
            }}>
              {item.rag ? item.rag.toUpperCase() : ''}
            </span>
          </>
        ) : (
          <em style={{ color: '#6c757d' }}>{item.task}</em>
        )}
      </li>
    ))}
  </ul>
);

// --- Grid View Sub-Component ---
const GridView = ({ schedule }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Group schedule items by day for easier rendering in columns
  const scheduleByDay = days.reduce((acc, day) => {
      acc[day] = schedule.filter(item => item.day === day);
      return acc;
  }, {});


  return (
    <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '800px', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {/* Adjust first column width if needed */}
            {/* <th style={{ border: '1px solid #ccc', padding: '0.5rem', width: '100px', backgroundColor: '#f8f9fa' }}>Day</th> */}
            {days.map(day => (
              <th key={day} style={{ border: '1px solid #ccc', padding: '0.8rem', backgroundColor: '#f8f9fa', textAlign: 'center', fontWeight: 'bold' }}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
           {/* Simplified row - listing activities vertically under each day */}
           <tr>
               {days.map(day => (
                   <td key={day} style={{ border: '1px solid #ccc', padding: '0.5rem', verticalAlign: 'top' }}>
                       {(scheduleByDay[day] || []).length === 0 ? (
                            <div style={{ color: '#aaa', textAlign: 'center', padding: '1rem 0', fontStyle: 'italic' }}>-</div>
                       ) : (
                           (scheduleByDay[day] || []).map((item, index) => (
                                <div
                                    key={index}
                                    style={{
                                        fontSize: '0.85rem',
                                        marginBottom: '0.4rem',
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: '3px',
                                        backgroundColor: item.type === 'break' ? '#e9ecef' : (item.rag === 'red' ? '#f8d7da' : item.rag === 'amber' ? '#fff3cd' : '#d4edda'),
                                        borderLeft: `4px solid ${item.type === 'break' ? '#6c757d' : (item.rag === 'red' ? '#dc3545' : item.rag === 'amber' ? '#ffc107' : '#28a745')}`
                                    }}
                                    title={`${item.task} (${item.duration} mins)`} // Tooltip on hover
                                >
                                  <strong>{item.startTime}-{item.endTime}</strong><br/>
                                  {item.task}
                                </div>
                           ))
                       )}
                   </td>
               ))}
           </tr>
           {/* Note: A true time-grid (rows for hours) is much more complex and usually involves CSS Grid/Flexbox tricks or libraries */}
        </tbody>
      </table>
    </div>
  );
};


// --- Main Schedule Display Component ---
function ScheduleDisplay({ generatedSchedule, warnings }) {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  // Handle case where schedule generation might result in an empty array but wasn't initially empty
  if (!generatedSchedule || generatedSchedule.length === 0) {
    // This case should ideally be handled in App.js before rendering ScheduleDisplay,
    // but as a fallback:
    return <p style={{ marginTop: '1rem', fontStyle: 'italic', color: '#666' }}>No schedule items could be generated with the current inputs.</p>;
  }

  return (
    <section style={{ marginTop: '2rem', textAlign: 'left' }}> {/* Reset text align from parent center */}
      <h2 style={{ borderBottom: '2px solid #28a745', paddingBottom: '0.5rem' }}>📅 Your Generated Revision Schedule</h2>

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div style={{ border: '1px solid #ffc107', backgroundColor: '#fff3cd', color: '#856404', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' }}>
          <strong>Heads up!</strong>
          <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
            {warnings.map((warning, index) => <li key={index}>{warning}</li>)}
          </ul>
        </div>
      )}

      {/* View Toggle Button */}
      <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <button onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')} style={{ padding: '0.6rem 1.2rem', cursor: 'pointer', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px' }}>
          Switch to {viewMode === 'list' ? 'Grid' : 'List'} View
        </button>
      </div>

      {/* Conditional Rendering based on viewMode */}
      {viewMode === 'list' ? (
        <ListView schedule={generatedSchedule} />
      ) : (
        <GridView schedule={generatedSchedule} />
      )}
    </section>
  );
}

export default ScheduleDisplay;