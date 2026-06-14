import { useCallback, useRef } from 'react';

/**
 * Professional hook for playing system notification sounds.
 * Manages AudioContext lifecycle to avoid browser policy issues.
 */
export function useNotificationSound() {
  const audioCtxRef = useRef(null);

  const playBeep = useCallback((frequency = 880, duration = 0.1, volume = 0.1) => {
    try {
      // Initialize AudioContext on first interaction
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const ctx = audioCtxRef.current;
      
      // Resume if suspended (browser requirements)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.warn('⚠️ Audio notification failed:', error);
    }
  }, []);

  return { playBeep };
}
