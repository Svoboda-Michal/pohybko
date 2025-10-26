import { Station, Scan, User } from '@/types';

// CO₂ emission factors (grams CO₂ per km)
const EMISSION_FACTORS = {
  car: 150,
  bus: 80,
  bike: 0,
  walk: 0,
} as const;

const STORAGE_KEYS = {
  STATIONS: 'active_mobility_stations',
  SCANS: 'active_mobility_scans',
  LAST_SCAN: 'active_mobility_last_scan',
};

// Generate unique 6-digit station code
const generateStationCode = (): string => {
  const stationsJson = localStorage.getItem(STORAGE_KEYS.STATIONS) || '[]';
  const stations: Station[] = JSON.parse(stationsJson);
  const existingCodes = new Set(stations.map(s => s.stationCode).filter(Boolean));
  
  let code: string;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (existingCodes.has(code));
  
  return code;
};

// Initialize with demo stations
const initializeDemoStations = () => {
  const existingStations = localStorage.getItem(STORAGE_KEYS.STATIONS);
  if (!existingStations) {
    const demoStations: Station[] = [
      {
        id: 'station-1',
        name: 'Main School Gate',
        schoolId: 'school-1',
        pointsValue: 10,
        totalScans: 45,
        totalCo2SavedG: 2250, // Demo data
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        stationCode: '123456',
        latitude: 48.148598,
        longitude: 17.107748,
        requireLocation: true,
        locationRadiusMeters: 50,
      },
      {
        id: 'station-2',
        name: 'Park Walking Path',
        schoolId: 'school-1',
        pointsValue: 10,
        totalScans: 32,
        totalCo2SavedG: 1600, // Demo data
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        stationCode: '234567',
        requireLocation: false,
      },
      {
        id: 'station-3',
        name: 'Bus Stop Check-in',
        schoolId: 'school-1',
        pointsValue: 10,
        totalScans: 28,
        totalCo2SavedG: 1400, // Demo data
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        stationCode: '345678',
        latitude: 48.150000,
        longitude: 17.110000,
        requireLocation: true,
        locationRadiusMeters: 100,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(demoStations));
  }
};

initializeDemoStations();

export const mockData = {
  getStations: (schoolId: string): Station[] => {
    const stationsJson = localStorage.getItem(STORAGE_KEYS.STATIONS) || '[]';
    const stations: Station[] = JSON.parse(stationsJson);
    return stations.filter(s => s.schoolId === schoolId);
  },

  createStation: (
    name: string,
    schoolId: string,
    pointsValue: number = 10,
    coordinates?: { latitude: number; longitude: number },
    requireLocation: boolean = false,
    locationRadiusMeters: number = 50
  ): Station => {
    const stationsJson = localStorage.getItem(STORAGE_KEYS.STATIONS) || '[]';
    const stations: Station[] = JSON.parse(stationsJson);

    const newStation: Station = {
      id: `station-${Date.now()}`,
      name,
      schoolId,
      pointsValue,
      totalScans: 0,
      totalCo2SavedG: 0,
      createdAt: new Date().toISOString(),
      stationCode: generateStationCode(),
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
      requireLocation,
      locationRadiusMeters,
    };

    stations.push(newStation);
    localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(stations));
    return newStation;
  },

  getStationByCode: (code: string, schoolId: string): Station | null => {
    const stationsJson = localStorage.getItem(STORAGE_KEYS.STATIONS) || '[]';
    const stations: Station[] = JSON.parse(stationsJson);
    return stations.find(s => s.stationCode === code && s.schoolId === schoolId) || null;
  },

  updateStation: (stationId: string, updates: Partial<Station>) => {
    const stationsJson = localStorage.getItem(STORAGE_KEYS.STATIONS) || '[]';
    const stations: Station[] = JSON.parse(stationsJson);
    const index = stations.findIndex(s => s.id === stationId);

    if (index !== -1) {
      stations[index] = { ...stations[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(stations));
    }
  },

  deleteStation: (stationId: string) => {
    const stationsJson = localStorage.getItem(STORAGE_KEYS.STATIONS) || '[]';
    const stations: Station[] = JSON.parse(stationsJson);
    const filtered = stations.filter(s => s.id !== stationId);
    localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(filtered));
  },

  canScanStation: (userId: string, stationId: string): boolean => {
    const lastScansJson = localStorage.getItem(STORAGE_KEYS.LAST_SCAN) || '{}';
    const lastScans: Record<string, string> = JSON.parse(lastScansJson);
    const key = `${userId}-${stationId}`;
    const lastScan = lastScans[key];

    if (!lastScan) return true;

    // Allow one scan per 4 hours per station
    const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
    return new Date(lastScan).getTime() < fourHoursAgo;
  },

  calculateCo2Saved: (distanceKm: number, transportMode: 'walk' | 'bike' | 'bus' | 'car'): number => {
    const carEmission = EMISSION_FACTORS.car;
    const modeEmission = EMISSION_FACTORS[transportMode];
    return Math.round(distanceKm * (carEmission - modeEmission));
  },

  recordScan: (userId: string, stationId: string, transportMode: 'walk' | 'bike' | 'bus' | 'car', points: number = 10): Scan => {
    // Get user's distance to school
    const usersJson = localStorage.getItem('active_mobility_users') || '[]';
    const users: User[] = JSON.parse(usersJson);
    const user = users.find(u => u.id === userId);
    const distanceKm = user?.distanceToSchoolKm || 2.0; // Default 2km if not set

    // Calculate CO₂ saved
    const co2SavedG = mockData.calculateCo2Saved(distanceKm, transportMode);

    // Record the scan
    const scansJson = localStorage.getItem(STORAGE_KEYS.SCANS) || '[]';
    const scans: Scan[] = JSON.parse(scansJson);

    const newScan: Scan = {
      id: `scan-${Date.now()}`,
      userId,
      stationId,
      transportMode,
      co2SavedG,
      timestamp: new Date().toISOString(),
      points,
    };

    scans.push(newScan);
    localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(scans));

    // Update last scan time
    const lastScansJson = localStorage.getItem(STORAGE_KEYS.LAST_SCAN) || '{}';
    const lastScans: Record<string, string> = JSON.parse(lastScansJson);
    const key = `${userId}-${stationId}`;
    lastScans[key] = newScan.timestamp;
    localStorage.setItem(STORAGE_KEYS.LAST_SCAN, JSON.stringify(lastScans));

    // Update station total scans and CO₂
    const stationsJson = localStorage.getItem(STORAGE_KEYS.STATIONS) || '[]';
    const stations: Station[] = JSON.parse(stationsJson);
    const stationIndex = stations.findIndex(s => s.id === stationId);
    if (stationIndex !== -1) {
      stations[stationIndex].totalScans++;
      stations[stationIndex].totalCo2SavedG += co2SavedG;
      localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(stations));
    }

    // Update user's total CO₂ saved
    if (user) {
      user.totalCo2SavedG += co2SavedG;
      user.totalPoints += points;
      localStorage.setItem('active_mobility_users', JSON.stringify(users));
    }

    return newScan;
  },

  getScans: (schoolId: string): Scan[] => {
    const scansJson = localStorage.getItem(STORAGE_KEYS.SCANS) || '[]';
    return JSON.parse(scansJson);
  },
};
