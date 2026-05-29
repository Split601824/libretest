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
      if (breakConfig.allowEarlyContinue) {
        setCanContinue(true);
      } else {
        setCanContinue(false);
      }
    } else {
      setTimeLeft(null);
      setCanContinue(true);
    }
  }, [breakConfig.durationMinutes, breakConfig.allowEarlyContinue]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          // Timer ended
          if (!breakConfig.allowEarlyContinue) {
            onContinue();
          }
          setCanContinue(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, breakConfig.allowEarlyContinue, onContinue]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleContinue = () => {
    if (canContinue) {
      onContinue();
    }
  };

  const hasTimer = breakConfig.durationMinutes !== undefined && breakConfig.durationMinutes > 0;
  const isTimerActive = hasTimer && timeLeft !== null && timeLeft > 0;

  return (
    <div style={{ 
      fontFamily: 'Roboto, sans-serif', 
      backgroundColor: '#ffffff', 
      minHeight: '100vh', 
      color: '#000000',
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
        <div style={{ fontSize: '20px', color: '#ffffff', fontFamily: 'Roboto, sans-serif' }}>
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
        {/* Section Complete */}
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
            You've completed: <strong style={{ color: '#000000' }}>{groupName}</strong>
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

        {/* Break Message */}
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

        {/* Timer Display */}
        {isTimerActive && (
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

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          style={{
            padding: '14px 32px',
            backgroundColor: canContinue ? '#00c462' : '#cccccc',
            color: canContinue ? '#ffffff' : '#666666',
            border: 'none',
            borderRadius: '8px',
            cursor: canContinue ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: '16px',
            fontFamily: 'Roboto, sans-serif',
            width: '100%',
            maxWidth: '200px'
          }}
        >
          Continue →
        </button>

        {/* Hints */}
        {breakConfig.allowEarlyContinue && isTimerActive && (
          <div style={{ marginTop: '16px', fontSize: '12px', color: '#999999', fontFamily: 'Roboto, sans-serif' }}>
            You can continue early at any time
          </div>
        )}

        {!breakConfig.allowEarlyContinue && isTimerActive && (
          <div style={{ marginTop: '16px', fontSize: '12px', color: '#999999', fontFamily: 'Roboto, sans-serif' }}>
            Exam will continue automatically when timer reaches zero
          </div>
        )}
      </div>
    </div>
  );
}