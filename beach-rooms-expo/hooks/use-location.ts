import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

export type LocationStatus = 'pending' | 'granted' | 'denied' | 'error';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

interface UseLocationResult {
  location: UserLocation | null;
  status: LocationStatus;
  requestPermission: () => Promise<void>;
  refreshLocation: () => Promise<void>;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const locationRef = useRef<UserLocation | null>(null);
  const [status, setStatus] = useState<LocationStatus>('pending');

  const updateLocation = useCallback((latitude: number, longitude: number) => {
    const prev = locationRef.current;
    if (prev && prev.latitude === latitude && prev.longitude === longitude) return;
    const next = { latitude, longitude };
    locationRef.current = next;
    setLocation(next);
  }, []);

  const getLocation = useCallback(async () => {
    try {
      // Use cached location for instant result
      const last = await Location.getLastKnownPositionAsync();
      if (last) {
        updateLocation(last.coords.latitude, last.coords.longitude);
      }
      // Always fetch fresh position to pick up changes
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      updateLocation(position.coords.latitude, position.coords.longitude);
    } catch {
      // If getCurrentPositionAsync fails but we already got cached location, don't error
      if (!locationRef.current) {
        setStatus('error');
      }
    }
  }, [updateLocation]);

  const checkPermission = useCallback(async () => {
    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      if (existingStatus === 'granted') {
        setStatus('granted');
        await getLocation();
      } else if (existingStatus === 'denied') {
        setStatus('denied');
      } else {
        // Permission not yet determined — prompt the user on first launch
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        if (newStatus === 'granted') {
          setStatus('granted');
          await getLocation();
        } else {
          setStatus('denied');
        }
      }
    } catch {
      setStatus('error');
    }
  }, [getLocation]);

  const requestPermission = useCallback(async () => {
    try {
      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus === 'granted') {
        setStatus('granted');
        await getLocation();
      } else {
        setStatus('denied');
      }
    } catch {
      setStatus('error');
    }
  }, [getLocation]);

  const refreshLocation = useCallback(async () => {
    if (status === 'granted') {
      await getLocation();
    }
  }, [status, getLocation]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    location,
    status,
    requestPermission,
    refreshLocation,
  };
}
