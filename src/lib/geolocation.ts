/**
 * Geolocation utility functions for station proximity verification
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in meters
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if user is within specified radius of station
 * @param userCoords User's current coordinates
 * @param stationCoords Station's coordinates
 * @param radiusMeters Allowed radius in meters
 * @returns true if within radius, false otherwise
 */
export function isWithinRadius(
  userCoords: Coordinates,
  stationCoords: Coordinates,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(userCoords, stationCoords);
  return distance <= radiusMeters;
}

/**
 * Get user's current location using browser Geolocation API
 * @returns Promise with user's coordinates or null if not available
 */
export async function getCurrentLocation(): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Verify if user is at the correct location for scanning
 * @param stationLatitude Station's latitude
 * @param stationLongitude Station's longitude
 * @param radiusMeters Allowed radius in meters
 * @returns Object with verification result and distance
 */
export async function verifyLocation(
  stationLatitude: number,
  stationLongitude: number,
  radiusMeters: number = 50
): Promise<{
  verified: boolean;
  distance: number | null;
  error?: string;
}> {
  const userLocation = await getCurrentLocation();

  if (!userLocation) {
    return {
      verified: false,
      distance: null,
      error: 'Nepodarilo sa získať vašu polohu. Skontrolujte povolenia pre prístup k polohe.',
    };
  }

  const stationCoords: Coordinates = {
    latitude: stationLatitude,
    longitude: stationLongitude,
  };

  const distance = calculateDistance(userLocation, stationCoords);
  const verified = distance <= radiusMeters;

  return {
    verified,
    distance,
    error: verified
      ? undefined
      : `Ste príliš ďaleko od stanice. Vzdialenosť: ${Math.round(distance)}m (max: ${radiusMeters}m)`,
  };
}

