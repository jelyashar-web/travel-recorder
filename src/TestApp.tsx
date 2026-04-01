function TestApp() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#111827', 
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      fontFamily: 'system-ui'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>✅ האפליקציה עובדת!</h1>
        <p style={{ color: '#9ca3af', marginTop: '16px' }}>
          אם אתה רואה את זה - React עובד
        </p>
      </div>
    </div>
  );
}

export default TestApp;
