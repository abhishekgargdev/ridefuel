'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type GpsSpeedStatus =
  | 'inactive'
  | 'searching'
  | 'active'
  | 'unavailable'
  | 'denied'
  | 'unsupported'
  | 'error';

export interface UseGpsSpeedReturn {
  speed: number | null; // km/h or null if unavailable
  status: GpsSpeedStatus;
  isTracking: boolean;
  statusLabel: string;
  errorMessage: string | null;
  startTracking: () => void;
  stopTracking: () => void;
  toggleTracking: () => void;
}

export function useGpsSpeed(): UseGpsSpeedReturn {
  const [speed, setSpeed] = useState<number | null>(null);
  const [status, setStatus] = useState<GpsSpeedStatus>('inactive');
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const isTrackingRef = useRef<boolean>(false);

  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  const clearCurrentWatch = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const stopTracking = useCallback(() => {
    clearCurrentWatch();
    setIsTracking(false);
    setSpeed(null);
    setStatus('inactive');
    setErrorMessage(null);
  }, [clearCurrentWatch]);

  const startTracking = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setStatus('unsupported');
      setErrorMessage('Geolocation is not supported by your browser');
      return;
    }

    clearCurrentWatch();
    setIsTracking(true);
    setStatus('searching');
    setErrorMessage(null);

    try {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const rawSpeed = position.coords.speed;
          if (rawSpeed !== null && rawSpeed >= 0) {
            // Convert m/s to km/h
            const kmh = Math.round(rawSpeed * 3.6);
            setSpeed(kmh);
            setStatus('active');
            setErrorMessage(null);
          } else {
            // GPS fix acquired, but hardware/device cannot supply instantaneous speed
            setSpeed(null);
            setStatus('unavailable');
            setErrorMessage('Speed unavailable from sensor');
          }
        },
        (error) => {
          setSpeed(null);
          if (error.code === error.PERMISSION_DENIED) {
            setStatus('denied');
            setErrorMessage('Location permission was denied');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setStatus('unavailable');
            setErrorMessage('GPS signal unavailable');
          } else if (error.code === error.TIMEOUT) {
            setStatus('unavailable');
            setErrorMessage('GPS signal timed out');
          } else {
            setStatus('error');
            setErrorMessage(error.message || 'GPS telemetry error');
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000,
        }
      );

      watchIdRef.current = id;
    } catch (err: unknown) {
      setSpeed(null);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to initialize GPS');
    }
  }, [clearCurrentWatch]);

  const toggleTracking = useCallback(() => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [isTracking, startTracking, stopTracking]);

  // Battery Conservation: Pause GPS watch when tab/window is hidden, resume when visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (watchIdRef.current !== null) {
          clearCurrentWatch();
        }
      } else if (document.visibilityState === 'visible' && isTrackingRef.current) {
        startTracking();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearCurrentWatch();
    };
  }, [clearCurrentWatch, startTracking]);

  // Derived human readable status label
  let statusLabel = 'Speed unavailable';
  if (status === 'active' && speed !== null) {
    statusLabel = 'Live GPS Speed';
  } else if (status === 'searching') {
    statusLabel = 'Acquiring GPS fix...';
  } else if (status === 'denied') {
    statusLabel = 'Location permission denied';
  } else if (status === 'unsupported') {
    statusLabel = 'GPS unsupported';
  } else if (status === 'inactive') {
    statusLabel = 'GPS inactive · Tap to enable';
  } else if (status === 'unavailable') {
    statusLabel = 'Speed unavailable';
  }

  return {
    speed,
    status,
    isTracking,
    statusLabel,
    errorMessage,
    startTracking,
    stopTracking,
    toggleTracking,
  };
}
