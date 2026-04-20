import { useCallback, useEffect, useState } from 'react';
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
  const [status, setStatus] = useState<LocationStatus>('pending');

  const getLocation = useCallback(async () => {
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch {
      setStatus('error');
    }
  }, []);

  const checkPermission = useCallback(async () => {
    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      if (existingStatus === 'granted') {
        setStatus('granted');
        await getLocation();
      } else if (existingStatus === 'denied') {
        setStatus('denied');
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
