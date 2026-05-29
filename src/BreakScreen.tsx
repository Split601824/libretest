import React, { useState, useEffect } from 'react';

interface BreakConfig {
  enabled: boolean;
  durationMinutes?: number;
  message: string;
  allowEarlyContinue: boolean;
}

interface BreakScreenProps {
  breakConfig: BreakConfig;
  groupName: string;
  groupPath: string;
  onContinue: () => void;
}

export function BreakScreen({ breakConfig, groupName, groupPath, onContinue }: BreakScreenProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [canContinue, setCanContinue] = useState(false);

  // Initialize timer
  useEffect(() => {
    if (breakConfig.durationMinutes !== undefined && breakConfig.durationMinutes > 0) {
      setTimeLeft(breakConfig.durationMinutes * 60);
    } else {
      setTimeLeft(null);
    }
  }, [breakConfig.durationMinutes]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setCanContinue(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Handle early continue
  useEffect(() => {
    if (breakConfig.allowEarlyContinue) {
      setCanContinue(true);
    }
  }, [breakConfig.allowEarlyContinue]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleContinue = () => {
    if (canContinue) {
      onContinue();
    }
  };

  // Auto-continue when timer ends (if not early continue)
  useEffect(() => {
    if (timeLeft === 0 && !breakConfig.allowEarlyContinue) {
      onContinue();
    }
  }, [timeLeft, breakConfig.allowEarlyContinue, onContinue]);

  return (
    <div style={{ 
      fontFamily: 'Roboto, sans-serif', 
      backgroundColor: 'white', 
      minHeight: '100vh', 
      color: 'black',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      {/* Top bar */}
      <div style={{ 
        backgroundColor: '#00c462', 
        padding: '12px 24px', 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0,
        zIndex: 10
      }}>
        <div style={{ fontSize: '20px', color: 'white' }}>
          <span style={{ fontWeight: 'bold' }}>LibreTest</span> Player
        </div>
      </div>

      {/* Main content */}
      <div style={{ 
        maxWidth: '500px', 
        width: '100%', 
        marginTop: '80px',
        textAlign: 'center'
      }}>
        {/* Completed message */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#00c462', 
            marginBottom: '16px',
            fontFamily: 'Roboto, sans-serif'
          }}>
            ✓ Section Complete
          </div>
          <div style={{ 
            fontSize: '16px', 
            color: '#666666', 
            fontFamily: 'Roboto, sans-serif'
          }}>
            You've completed: <strong>{groupName}</strong>
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: '#999999', 
            marginTop: '4px',
            fontFamily: 'Roboto, sans-serif'
          }}>
            {groupPath}
          </div>
        </div>

        {/* Break message */}
        <div style={{ 
          padding: '24px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '12px',
          marginBottom: '32px'
        }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: '#000000', 
            marginBottom: '16px',
            fontFamily: 'Roboto, sans-serif'
          }}>
            ☕ Break Time
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: '#333333', 
            lineHeight: '1.5',
            fontFamily: 'Roboto, sans-serif'
          }}>
            {breakConfig.message}
          </div>
        </div>

        {/* Timer */}
        {timeLeft !== null && timeLeft > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ 
              fontSize: '48px', 
              fontWeight: 'bold', 
              color: '#00c462',
              fontFamily: 'Roboto, sans-serif',
              letterSpacing: '2px'
            }}>
              {formatTime(timeLeft)}
            </div>
            <div style={{ 
              fontSize: '13px', 
              color: '#666666',
              fontFamily: 'Roboto, sans-serif'
            }}>
              until break ends
            </div>
          </div>
        )}

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          style={{
            padding: '14px 32px',
            backgroundColor: canContinue ? '#00c462' : '#cccccc',
            color: canContinue ? 'white' : '#666666',
            border: 'none',
            borderRadius: '8px',
            cursor: canContinue ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: '16px',
            fontFamily: 'Roboto, sans-serif',
            transition: 'background-color 0.2s',
            width: '100%',
            maxWidth: '200px'
          }}
        >
          Continue →
        </button>

        {/* Early continue hint */}
        {breakConfig.allowEarlyContinue && timeLeft !== null && timeLeft > 0 && (
          <div style={{ 
            marginTop: '16px', 
            fontSize: '12px', 
            color: '#999999',
            fontFamily: 'Roboto, sans-serif'
          }}>
            You can continue early at any time
          </div>
        )}

        {/* Auto-continue hint */}
        {!breakConfig.allowEarlyContinue && timeLeft !== null && timeLeft > 0 && (
          <div style={{ 
            marginTop: '16px', 
            fontSize: '12px', 
            color: '#999999',
            fontFamily: 'Roboto, sans-serif'
          }}>
            Exam will continue automatically when timer reaches zero
          </div>
        )}
      </div>
    </div>
  );
}