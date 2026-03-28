// ===================================================
// Flavos IA 3.0 — ErrorBanner (Web)
// Premium error notification with contextual icons,
// 429 countdown timer, and Retry action.
// ===================================================

import React, { useEffect, useRef, useState } from 'react';

type ErrorType = 'rate_limit' | 'network' | 'stream' | 'backend' | 'unknown' | null;

interface ErrorBannerProps {
  error: string;
  errorType?: ErrorType;
  retryAfter?: number | null;
  onDismiss: () => void;
  onRetry?: () => void;
}

const ICONS: Record<NonNullable<ErrorType>, string> = {
  rate_limit: 'schedule',
  network:    'wifi_off',
  stream:     'sync_problem',
  backend:    'cloud_off',
  unknown:    'error',
};

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  errorType = 'unknown',
  retryAfter = null,
  onDismiss,
  onRetry,
}) => {
  const [countdown, setCountdown] = useState<number | null>(
    errorType === 'rate_limit' && retryAfter ? retryAfter : null
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRateLimit = errorType === 'rate_limit';
  const icon = ICONS[errorType ?? 'unknown'] ?? 'error';

  // Countdown for 429
  useEffect(() => {
    if (!isRateLimit || !retryAfter) return;
    setCountdown(retryAfter);
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(intervalRef.current!);
          onDismiss();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRateLimit, retryAfter]);

  return (
    <div
      role="alert"
      style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: 'calc(100% - 40px)',
        maxWidth: 680,
        padding: '11px 14px',
        borderRadius: 14,
        background: isRateLimit
          ? 'rgba(255, 153, 0, 0.10)'
          : 'rgba(214, 41, 57, 0.11)',
        border: `1px solid ${isRateLimit ? 'rgba(255,153,0,0.3)' : 'rgba(214,41,57,0.28)'}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        animation: 'errorSlideDown 0.22s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {/* Keyframe injected once */}
      <style>{`@keyframes errorSlideDown{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>

      {/* Icon */}
      <span
        className="material-symbols-rounded"
        style={{
          fontSize: 20,
          flexShrink: 0,
          color: isRateLimit ? '#ff9900' : 'var(--error)',
        }}
      >
        {icon}
      </span>

      {/* Message */}
      <span
        style={{
          flex: 1,
          fontSize: '0.875rem',
          color: isRateLimit ? '#ffb347' : 'var(--error)',
          lineHeight: 1.45,
        }}
      >
        {error}
        {isRateLimit && countdown !== null && (
          <span style={{ opacity: 0.75, marginLeft: 6, fontSize: '0.82rem' }}>
            ({countdown}s)
          </span>
        )}
      </span>

      {/* Retry button — only for non-rate-limit with a retry action */}
      {onRetry && !isRateLimit && (
        <button
          onClick={onRetry}
          title="Tentar novamente"
          style={{
            flexShrink: 0,
            background: 'rgba(214,41,57,0.15)',
            border: '1px solid rgba(214,41,57,0.3)',
            borderRadius: 8,
            color: 'var(--error)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontFamily: 'inherit',
            fontWeight: 500,
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(214,41,57,0.25)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(214,41,57,0.15)')}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 14 }}>refresh</span>
          Tentar novamente
        </button>
      )}

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        title="Fechar"
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          color: isRateLimit ? '#ff9900' : 'var(--error)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: 4,
          opacity: 0.75,
          borderRadius: 6,
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.75')}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>close</span>
      </button>
    </div>
  );
};
