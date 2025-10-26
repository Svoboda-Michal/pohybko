import { supabase } from './supabase';
import { Station, Scan, User, Quiz, QuizResponse } from '@/types';
import { calculateCO2SavedPerTrip, type TransportMode } from './co2Calculator';

// CO₂ emission factors (grams CO₂ per km)
const EMISSION_FACTORS = {
  car: 150,
  bus: 80,
  bike: 0,
  walk: 0,
} as const;

// Generate unique 6-digit station code
const generateStationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const supabaseData = {
  // Get stations for a school
  getStations: async (schoolId: string): Promise<Station[]> => {
    try {
      const { data, error } = await supabase
        .from('stations')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stations:', error);
        return [];
      }

      return data.map(station => ({
        id: station.id,
        name: station.name,
        schoolId: station.school_id,
        pointsValue: station.points_value,
        totalScans: station.total_scans,
        totalCo2SavedG: station.total_co2_saved_g,
        createdAt: station.created_at,
        stationCode: station.station_code || '',
        latitude: station.latitude,
        longitude: station.longitude,
        requireLocation: station.require_location || false,
        locationRadiusMeters: station.location_radius_meters || 50,
      }));
    } catch (error) {
      console.error('Error fetching stations:', error);
      return [];
    }
  },

  // Create new station
  createStation: async (
    name: string,
    schoolId: string,
    pointsValue: number = 10,
    coordinates?: { latitude: number; longitude: number },
    requireLocation: boolean = false,
    locationRadiusMeters: number = 50
  ): Promise<Station | null> => {
    try {
      // Basic station data (always include)
      const insertData: any = {
        name,
        school_id: schoolId,
        points_value: pointsValue,
        total_scans: 0,
        total_co2_saved_g: 0,
        station_code: generateStationCode(),
      };

      // Try to insert with geolocation fields first
      let result = await supabase
        .from('stations')
        .insert({
          ...insertData,
          latitude: coordinates?.latitude || null,
          longitude: coordinates?.longitude || null,
          require_location: requireLocation,
          location_radius_meters: locationRadiusMeters,
        })
        .select()
        .single();

      // If error, try without geolocation fields (backward compatibility)
      if (result.error) {
        console.warn('Geolocation fields not supported. Creating station without them.');
        console.warn('To enable geolocation, run: supabase-migration-geolocation.sql');
        
        result = await supabase
          .from('stations')
          .insert(insertData)
          .select()
          .single();
      }

      const { data, error } = result;

      if (error) {
        console.error('Error creating station:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        schoolId: data.school_id,
        pointsValue: data.points_value,
        totalScans: data.total_scans,
        totalCo2SavedG: data.total_co2_saved_g,
        createdAt: data.created_at,
        stationCode: data.station_code,
        latitude: data.latitude,
        longitude: data.longitude,
        requireLocation: data.require_location,
        locationRadiusMeters: data.location_radius_meters,
      };
    } catch (error) {
      console.error('Error creating station:', error);
      return null;
    }
  },

  // Get station by code
  getStationByCode: async (code: string, schoolId: string): Promise<Station | null> => {
    try {
      const { data, error } = await supabase
        .from('stations')
        .select('*')
        .eq('station_code', code)
        .eq('school_id', schoolId)
        .single();

      if (error) {
        console.error('Error fetching station by code:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        schoolId: data.school_id,
        pointsValue: data.points_value,
        totalScans: data.total_scans,
        totalCo2SavedG: data.total_co2_saved_g,
        createdAt: data.created_at,
        stationCode: data.station_code,
        latitude: data.latitude,
        longitude: data.longitude,
        requireLocation: data.require_location,
        locationRadiusMeters: data.location_radius_meters,
      };
    } catch (error) {
      console.error('Error fetching station by code:', error);
      return null;
    }
  },

  // Update station
  updateStation: async (stationId: string, updates: Partial<Station>) => {
    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.pointsValue !== undefined) updateData.points_value = updates.pointsValue;
      if (updates.totalScans !== undefined) updateData.total_scans = updates.totalScans;
      if (updates.totalCo2SavedG !== undefined) updateData.total_co2_saved_g = updates.totalCo2SavedG;
      if (updates.latitude !== undefined) updateData.latitude = updates.latitude;
      if (updates.longitude !== undefined) updateData.longitude = updates.longitude;
      if (updates.requireLocation !== undefined) updateData.require_location = updates.requireLocation;
      if (updates.locationRadiusMeters !== undefined) updateData.location_radius_meters = updates.locationRadiusMeters;

      const { error } = await supabase
        .from('stations')
        .update(updateData)
        .eq('id', stationId);

      if (error) {
        console.error('Error updating station:', error);
      }
    } catch (error) {
      console.error('Error updating station:', error);
    }
  },

  // Delete station
  deleteStation: async (stationId: string) => {
    try {
      const { error } = await supabase
        .from('stations')
        .delete()
        .eq('id', stationId);

      if (error) {
        console.error('Error deleting station:', error);
      }
    } catch (error) {
      console.error('Error deleting station:', error);
    }
  },

  // Check if user can scan station (cooldown check)
  canScanStation: async (userId: string, stationId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('last_scans')
        .select('last_scan')
        .eq('user_id', userId)
        .eq('station_id', stationId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking scan cooldown:', error);
        return true; // Allow scan if error
      }

      if (!data) {
        return true; // No previous scan, allow
      }

      // Allow one scan per 4 hours per station
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      const lastScan = new Date(data.last_scan);
      
      return lastScan < fourHoursAgo;
    } catch (error) {
      console.error('Error checking scan cooldown:', error);
      return true; // Allow scan if error
    }
  },

  // Calculate CO₂ saved
  calculateCo2Saved: (distanceKm: number, transportMode: 'walk' | 'bike' | 'bus' | 'car'): number => {
    const carEmission = EMISSION_FACTORS.car;
    const modeEmission = EMISSION_FACTORS[transportMode];
    return Math.round(distanceKm * (carEmission - modeEmission));
  },

  // Record a scan
  recordScan: async (userId: string, stationId: string, transportMode: 'walk' | 'bike' | 'bus' | 'car', points: number = 10): Promise<Scan | null> => {
    try {
      // Get user's distance to school and carpool info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('distance_to_school_km, carpool_passengers')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return null;
      }

      const distanceKm = userData.distance_to_school_km || 2.0;
      const passengers = userData.carpool_passengers || 1;

      // Calculate CO₂ saved per trip using the new calculator
      const co2SavedG = calculateCO2SavedPerTrip(distanceKm, transportMode as TransportMode, passengers);

      // Record the scan
      const { data: scanData, error: scanError } = await supabase
        .from('scans')
        .insert({
          user_id: userId,
          station_id: stationId,
          transport_mode: transportMode,
          co2_saved_g: co2SavedG,
          points,
        })
        .select()
        .single();

      if (scanError) {
        console.error('Error recording scan:', scanError);
        return null;
      }

      // Update last scan time
      await supabase
        .from('last_scans')
        .upsert({
          user_id: userId,
          station_id: stationId,
          last_scan: new Date().toISOString(),
        });

      // Update station totals using RPC for atomic increment
      await supabase.rpc('increment_station_totals', {
        station_uuid: stationId,
        scans_increment: 1,
        co2_increment: co2SavedG,
      });

      // Update user totals using RPC for atomic increment
      await supabase.rpc('increment_user_totals', {
        user_uuid: userId,
        points_increment: points,
        co2_increment: co2SavedG,
      });

      return {
        id: scanData.id,
        userId: scanData.user_id,
        stationId: scanData.station_id,
        transportMode: scanData.transport_mode,
        co2SavedG: scanData.co2_saved_g,
        timestamp: scanData.timestamp,
        points: scanData.points,
      };
    } catch (error) {
      console.error('Error recording scan:', error);
      return null;
    }
  },

  // Get scans for a school
  getScans: async (schoolId: string): Promise<Scan[]> => {
    try {
      const { data, error } = await supabase
        .from('scans')
        .select(`
          *,
          users!inner(school_id)
        `)
        .eq('users.school_id', schoolId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching scans:', error);
        return [];
      }

      return data.map(scan => ({
        id: scan.id,
        userId: scan.user_id,
        stationId: scan.station_id,
        transportMode: scan.transport_mode,
        co2SavedG: scan.co2_saved_g,
        timestamp: scan.timestamp,
        points: scan.points,
      }));
    } catch (error) {
      console.error('Error fetching scans:', error);
      return [];
    }
  },

  // Get scans for a specific user
  getUserScans: async (userId: string, limit: number = 10): Promise<Scan[]> => {
    try {
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user scans:', error);
        return [];
      }

      return data.map(scan => ({
        id: scan.id,
        userId: scan.user_id,
        stationId: scan.station_id,
        transportMode: scan.transport_mode,
        co2SavedG: scan.co2_saved_g,
        timestamp: scan.timestamp,
        points: scan.points,
      }));
    } catch (error) {
      console.error('Error fetching user scans:', error);
      return [];
    }
  },

  // Get users for a school (for leaderboard)
  getSchoolUsers: async (schoolId: string): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('school_id', schoolId)
        .eq('role', 'student')
        .order('total_points', { ascending: false });

      if (error) {
        console.error('Error fetching school users:', error);
        return [];
      }

      return data.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        schoolId: user.school_id,
        totalPoints: user.total_points,
        totalCo2SavedG: user.total_co2_saved_g,
        distanceToSchoolKm: user.distance_to_school_km,
        role: user.role,
      }));
    } catch (error) {
      console.error('Error fetching school users:', error);
      return [];
    }
  },

  // Get school leaderboard (all schools with aggregated stats)
  getSchoolLeaderboard: async () => {
    try {
      // Get all schools
      const { data: schools, error: schoolsError } = await supabase
        .from('schools')
        .select('id, name');

      if (schoolsError) {
        console.error('Error fetching schools:', schoolsError);
        return [];
      }

      // For each school, aggregate student points and CO2
      const schoolStats = await Promise.all(
        schools.map(async (school) => {
          const { data: students, error } = await supabase
            .from('users')
            .select('total_points, total_co2_saved_g')
            .eq('school_id', school.id)
            .eq('role', 'student');

          if (error) {
            console.error(`Error fetching students for school ${school.name}:`, error);
            return {
              id: school.id,
              name: school.name,
              totalPoints: 0,
              totalCo2SavedG: 0,
              studentCount: 0,
            };
          }

          const totalPoints = students.reduce((sum, s) => sum + (s.total_points || 0), 0);
          const totalCo2SavedG = students.reduce((sum, s) => sum + (s.total_co2_saved_g || 0), 0);

          return {
            id: school.id,
            name: school.name,
            totalPoints,
            totalCo2SavedG,
            studentCount: students.length,
          };
        })
      );

      // Sort by total points
      return schoolStats.sort((a, b) => b.totalPoints - a.totalPoints);
    } catch (error) {
      console.error('Error fetching school leaderboard:', error);
      return [];
    }
  },

  // ============= QUIZ MANAGEMENT =============

  // Get all quizzes for a school
  getQuizzes: async (schoolId: string): Promise<Quiz[]> => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quizzes:', error);
        return [];
      }

      return data.map(quiz => ({
        id: quiz.id,
        schoolId: quiz.school_id,
        question: quiz.question,
        optionA: quiz.option_a,
        optionB: quiz.option_b,
        optionC: quiz.option_c,
        correctAnswer: quiz.correct_answer,
        points: quiz.points,
        isActive: quiz.is_active,
        createdAt: quiz.created_at,
      }));
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      return [];
    }
  },

  // Get random active quiz for a school
  getRandomQuiz: async (schoolId: string): Promise<Quiz | null> => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching random quiz:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      // Pick random quiz
      const randomQuiz = data[Math.floor(Math.random() * data.length)];

      return {
        id: randomQuiz.id,
        schoolId: randomQuiz.school_id,
        question: randomQuiz.question,
        optionA: randomQuiz.option_a,
        optionB: randomQuiz.option_b,
        optionC: randomQuiz.option_c,
        correctAnswer: randomQuiz.correct_answer,
        points: randomQuiz.points,
        isActive: randomQuiz.is_active,
        createdAt: randomQuiz.created_at,
      };
    } catch (error) {
      console.error('Error fetching random quiz:', error);
      return null;
    }
  },

  // Create new quiz
  createQuiz: async (
    schoolId: string,
    question: string,
    optionA: string,
    optionB: string,
    optionC: string,
    correctAnswer: 'A' | 'B' | 'C',
    points: number = 5
  ): Promise<Quiz | null> => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .insert({
          school_id: schoolId,
          question,
          option_a: optionA,
          option_b: optionB,
          option_c: optionC,
          correct_answer: correctAnswer,
          points,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating quiz:', error);
        return null;
      }

      return {
        id: data.id,
        schoolId: data.school_id,
        question: data.question,
        optionA: data.option_a,
        optionB: data.option_b,
        optionC: data.option_c,
        correctAnswer: data.correct_answer,
        points: data.points,
        isActive: data.is_active,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('Error creating quiz:', error);
      return null;
    }
  },

  // Update quiz
  updateQuiz: async (quizId: string, updates: Partial<Quiz>): Promise<boolean> => {
    try {
      const updateData: any = {};
      
      if (updates.question !== undefined) updateData.question = updates.question;
      if (updates.optionA !== undefined) updateData.option_a = updates.optionA;
      if (updates.optionB !== undefined) updateData.option_b = updates.optionB;
      if (updates.optionC !== undefined) updateData.option_c = updates.optionC;
      if (updates.correctAnswer !== undefined) updateData.correct_answer = updates.correctAnswer;
      if (updates.points !== undefined) updateData.points = updates.points;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { error } = await supabase
        .from('quizzes')
        .update(updateData)
        .eq('id', quizId);

      if (error) {
        console.error('Error updating quiz:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating quiz:', error);
      return false;
    }
  },

  // Delete quiz
  deleteQuiz: async (quizId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) {
        console.error('Error deleting quiz:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting quiz:', error);
      return false;
    }
  },

  // Record quiz response
  recordQuizResponse: async (
    userId: string,
    quizId: string,
    stationId: string,
    selectedAnswer: 'A' | 'B' | 'C',
    correctAnswer: 'A' | 'B' | 'C',
    points: number
  ): Promise<QuizResponse | null> => {
    try {
      const isCorrect = selectedAnswer === correctAnswer;
      const pointsEarned = isCorrect ? points : 0;

      // Record the quiz response (mood will be updated separately)
      const { data: responseData, error: responseError } = await supabase
        .from('quiz_responses')
        .insert({
          user_id: userId,
          quiz_id: quizId,
          station_id: stationId,
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
          points_earned: pointsEarned,
        })
        .select()
        .single();

      if (responseError) {
        console.error('Error recording quiz response:', responseError);
        return null;
      }

      // If correct, update user's total points
      if (isCorrect) {
        console.log('Quiz correct! Updating user points:', { userId, pointsEarned });
        
        // Use direct update method (more reliable than RPC)
        const { data: currentUser, error: fetchError } = await supabase
          .from('users')
          .select('total_points')
          .eq('id', userId)
          .single();
        
        if (fetchError) {
          console.error('Failed to fetch current user:', fetchError);
        } else if (currentUser) {
          const newTotal = (currentUser.total_points || 0) + pointsEarned;
          console.log('Updating points:', currentUser.total_points, '→', newTotal);
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ total_points: newTotal })
            .eq('id', userId);
          
          if (updateError) {
            console.error('Failed to update points:', updateError);
            console.error('Error details:', JSON.stringify(updateError, null, 2));
          } else {
            console.log('✅ Points updated successfully! New total:', newTotal);
          }
        }
      }

      return {
        id: responseData.id,
        userId: responseData.user_id,
        quizId: responseData.quiz_id,
        stationId: responseData.station_id,
        selectedAnswer: responseData.selected_answer,
        isCorrect: responseData.is_correct,
        pointsEarned: responseData.points_earned,
        timestamp: responseData.timestamp,
        mood: responseData.mood,
      };
    } catch (error) {
      console.error('Error recording quiz response:', error);
      return null;
    }
  },

  // Update quiz response with mood
  updateQuizResponseMood: async (
    responseId: string,
    mood: number
  ): Promise<boolean> => {
    try {
      if (mood < 1 || mood > 5) {
        console.error('Invalid mood value. Must be between 1 and 5.');
        return false;
      }

      const { error } = await supabase
        .from('quiz_responses')
        .update({ mood })
        .eq('id', responseId);

      if (error) {
        console.error('Error updating quiz response mood:', error);
        return false;
      }

      console.log('✅ Mood updated successfully!', { responseId, mood });
      return true;
    } catch (error) {
      console.error('Error updating quiz response mood:', error);
      return false;
    }
  },

  // Get user's mood statistics
  getUserMoodStats: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_mood_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no data, return empty stats
        if (error.code === 'PGRST116') {
          return {
            totalResponses: 0,
            avgMood: 0,
            mood5Count: 0,
            mood4Count: 0,
            mood3Count: 0,
            mood2Count: 0,
            mood1Count: 0,
          };
        }
        console.error('Error fetching user mood stats:', error);
        return null;
      }

      return {
        totalResponses: data.total_responses || 0,
        avgMood: parseFloat(data.avg_mood) || 0,
        mood5Count: data.mood_5_count || 0,
        mood4Count: data.mood_4_count || 0,
        mood3Count: data.mood_3_count || 0,
        mood2Count: data.mood_2_count || 0,
        mood1Count: data.mood_1_count || 0,
      };
    } catch (error) {
      console.error('Error fetching user mood stats:', error);
      return null;
    }
  },

  // Get school's mood statistics
  getSchoolMoodStats: async (schoolId: string) => {
    try {
      // Get all quiz responses with mood for this school's students
      const { data, error } = await supabase
        .from('quiz_responses')
        .select(`
          mood,
          users!inner(school_id)
        `)
        .eq('users.school_id', schoolId)
        .not('mood', 'is', null);

      if (error) {
        console.error('Error fetching school mood stats:', error);
        return {
          totalResponses: 0,
          avgMood: 0,
          mood5Count: 0,
          mood4Count: 0,
          mood3Count: 0,
          mood2Count: 0,
          mood1Count: 0,
        };
      }

      if (!data || data.length === 0) {
        return {
          totalResponses: 0,
          avgMood: 0,
          mood5Count: 0,
          mood4Count: 0,
          mood3Count: 0,
          mood2Count: 0,
          mood1Count: 0,
        };
      }

      // Calculate statistics manually
      const moods = data.map(r => r.mood).filter(m => m !== null);
      const totalResponses = moods.length;
      const avgMood = totalResponses > 0 
        ? moods.reduce((sum, m) => sum + m, 0) / totalResponses 
        : 0;
      
      const mood5Count = moods.filter(m => m === 5).length;
      const mood4Count = moods.filter(m => m === 4).length;
      const mood3Count = moods.filter(m => m === 3).length;
      const mood2Count = moods.filter(m => m === 2).length;
      const mood1Count = moods.filter(m => m === 1).length;

      return {
        totalResponses,
        avgMood: parseFloat(avgMood.toFixed(2)),
        mood5Count,
        mood4Count,
        mood3Count,
        mood2Count,
        mood1Count,
      };
    } catch (error) {
      console.error('Error fetching school mood stats:', error);
      return {
        totalResponses: 0,
        avgMood: 0,
        mood5Count: 0,
        mood4Count: 0,
        mood3Count: 0,
        mood2Count: 0,
        mood1Count: 0,
      };
    }
  },

  // ============= CO₂ CALCULATOR MANAGEMENT =============

  // Log a CO₂ calculation to the database
  logCO2Calculation: async (
    userId: string,
    schoolId: string,
    mode: TransportMode,
    distance_km: number,
    trips_per_day: number,
    days_per_month: number,
    passengers: number,
    per_trip_g: number,
    per_day_g: number,
    monthly_g: number,
    saved_vs_car_per_trip_g: number | null,
    saved_vs_car_monthly_g: number | null
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('co2_calculations')
        .insert({
          user_id: userId,
          school_id: schoolId,
          mode,
          distance_km,
          trips_per_day,
          days_per_month,
          passengers,
          per_trip_g,
          per_day_g,
          monthly_g,
          saved_vs_car_per_trip_g,
          saved_vs_car_monthly_g,
        });

      if (error) {
        console.error('Error logging CO₂ calculation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error logging CO₂ calculation:', error);
      return false;
    }
  },

  // Get user's CO₂ calculation history
  getUserCO2Calculations: async (userId: string, limit: number = 10) => {
    try {
      const { data, error } = await supabase
        .from('co2_calculations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching CO₂ calculations:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error fetching CO₂ calculations:', error);
      return [];
    }
  },

  // Update user's transport preferences
  updateUserTransportPreferences: async (
    userId: string,
    defaultTransportMode: TransportMode,
    carpoolPassengers: number = 1,
    tripsPerDay: number = 2,
    daysPerMonth: number = 20
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          default_transport_mode: defaultTransportMode,
          carpool_passengers: carpoolPassengers,
          trips_per_day: tripsPerDay,
          days_per_month: daysPerMonth,
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating transport preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating transport preferences:', error);
      return false;
    }
  },
};
