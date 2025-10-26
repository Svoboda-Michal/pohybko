export interface User {
  id: string;
  name: string;
  email: string;
  schoolId: string;
  totalPoints: number;
  totalCo2SavedG: number;
  distanceToSchoolKm: number;
  role: 'student' | 'admin';
  defaultTransportMode?: 'walk' | 'bike' | 'bus' | 'car';
  carpoolPassengers?: number;
  tripsPerDay?: number;
  daysPerMonth?: number;
}

export interface School {
  id: string;
  name: string;
  email: string;
}

export interface Station {
  id: string;
  name: string;
  schoolId: string;
  pointsValue: number;
  totalScans: number;
  totalCo2SavedG: number;
  createdAt: string;
  stationCode: string; // 6-digit unique code
  latitude?: number;
  longitude?: number;
  requireLocation?: boolean;
  locationRadiusMeters?: number;
}

export interface Scan {
  id: string;
  userId: string;
  stationId: string;
  transportMode: 'walk' | 'bike' | 'bus' | 'car';
  co2SavedG: number;
  timestamp: string;
  points: number;
}

export interface Quiz {
  id: string;
  schoolId: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  correctAnswer: 'A' | 'B' | 'C';
  points: number;
  isActive: boolean;
  createdAt: string;
}

export interface QuizResponse {
  id: string;
  userId: string;
  quizId: string;
  stationId: string;
  selectedAnswer: 'A' | 'B' | 'C';
  isCorrect: boolean;
  pointsEarned: number;
  timestamp: string;
  mood?: number; // 1-5 mood rating
}

export interface MoodStats {
  totalResponses: number;
  avgMood: number;
  mood5Count: number;
  mood4Count: number;
  mood3Count: number;
  mood2Count: number;
  mood1Count: number;
}
