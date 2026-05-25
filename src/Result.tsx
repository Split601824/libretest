interface ResultProps {
  onExit: () => void;
}

export function Result({ onExit }: ResultProps) {
  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', padding: '20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'Roboto, sans-serif', fontWeight: '700' }}>Submitted</h1>
      <p>This exam is complete. You may exit the exam now.</p>
      
      <h3>Reminders:</h3>
      <ul style={{ textAlign: 'left' }}>
        <li>Do not distract candidates still testing.</li>
        <li>Maintain integrity of the test at all times.</li>
        <li>You may not return to this exam.</li>
        <li>Your results will be calculated shortly.</li>
      </ul>

      <button 
        onClick={onExit}
        style={{ 
          fontFamily: 'Roboto, sans-serif', 
          marginTop: '20px',
          padding: '10px 20px', 
          fontSize: '16px', 
          cursor: 'pointer',
          backgroundColor: '#15EB15',
          color: 'black',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        Exit
      </button>
    </div>
  );
}