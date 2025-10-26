/**
 * CO₂ Calculator for School Mobility Application
 * Calculates CO₂ emissions based on transport mode and distance
 */

export type TransportMode = 'car' | 'bus' | 'bike' | 'walk';

// Default emission factors (g CO₂ per km)
export const EMISSION_FACTORS: Record<TransportMode, number> = {
  car: 150,
  bus: 80,
  bike: 0,
  walk: 0,
} as const;

export interface CO2CalculationInput {
  mode: TransportMode;
  distance_km: number;
  trips_per_day?: number;
  days_per_month?: number;
  passengers?: number;
}

export interface CO2CalculationResult {
  per_trip_g: number;
  per_day_g: number;
  monthly_g: number;
  per_trip_kg: number;
  per_day_kg: number;
  monthly_kg: number;
  saved_vs_car_per_trip_kg: number | null;
  saved_vs_car_monthly_kg: number | null;
  assumptions: {
    mode: TransportMode;
    emission_factor: number;
    trips_per_day: number;
    days_per_month: number;
    passengers: number;
    distance_km: number;
  };
}

export interface CO2CalculationError {
  error: string;
  field?: string;
}

/**
 * Validates input parameters for CO₂ calculation
 */
export function validateInput(input: CO2CalculationInput): CO2CalculationError | null {
  const { mode, distance_km, trips_per_day = 2, days_per_month = 20, passengers = 1 } = input;

  // Validate mode
  if (!['car', 'bus', 'bike', 'walk'].includes(mode)) {
    return {
      error: 'Neplatný typ dopravy. Povolené hodnoty: car, bus, bike, walk',
      field: 'mode',
    };
  }

  // Validate distance_km
  if (typeof distance_km !== 'number' || isNaN(distance_km)) {
    return {
      error: 'Vzdialenosť musí byť číslo',
      field: 'distance_km',
    };
  }

  if (distance_km < 0) {
    return {
      error: 'Vzdialenosť musí byť nezáporná',
      field: 'distance_km',
    };
  }

  if (distance_km > 999) {
    return {
      error: 'Vzdialenosť je príliš veľká (max. 999 km)',
      field: 'distance_km',
    };
  }

  // Validate trips_per_day
  if (trips_per_day < 1 || trips_per_day > 10) {
    return {
      error: 'Počet ciest za deň musí byť medzi 1 a 10',
      field: 'trips_per_day',
    };
  }

  // Validate days_per_month
  if (days_per_month < 1 || days_per_month > 31) {
    return {
      error: 'Počet dní v mesiaci musí byť medzi 1 a 31',
      field: 'days_per_month',
    };
  }

  // Validate passengers
  if (passengers < 1 || passengers > 10) {
    return {
      error: 'Počet cestujúcich musí byť medzi 1 a 10',
      field: 'passengers',
    };
  }

  return null;
}

/**
 * Calculates CO₂ emissions for a given transport mode and distance
 */
export function calculateCO2(input: CO2CalculationInput): CO2CalculationResult | CO2CalculationError {
  // Validate input
  const validationError = validateInput(input);
  if (validationError) {
    return validationError;
  }

  const {
    mode,
    distance_km,
    trips_per_day = 2,
    days_per_month = 20,
    passengers = 1,
  } = input;

  // Get emission factor for the mode
  const factor = EMISSION_FACTORS[mode];

  // Calculate per trip emissions
  let per_trip_g = distance_km * factor;

  // If carpooling, divide by number of passengers
  if (mode === 'car' && passengers > 1) {
    per_trip_g = per_trip_g / passengers;
  }

  // Calculate daily and monthly emissions
  const per_day_g = per_trip_g * trips_per_day;
  const monthly_g = per_day_g * days_per_month;

  // Convert to kg
  const per_trip_kg = per_trip_g / 1000;
  const per_day_kg = per_day_g / 1000;
  const monthly_kg = monthly_g / 1000;

  // Calculate savings vs car (if not car)
  let saved_vs_car_per_trip_kg: number | null = null;
  let saved_vs_car_monthly_kg: number | null = null;

  if (mode !== 'car') {
    const car_per_trip_g = distance_km * EMISSION_FACTORS.car;
    const car_monthly_g = car_per_trip_g * trips_per_day * days_per_month;

    saved_vs_car_per_trip_kg = (car_per_trip_g - per_trip_g) / 1000;
    saved_vs_car_monthly_kg = (car_monthly_g - monthly_g) / 1000;
  }

  return {
    per_trip_g: Math.round(per_trip_g),
    per_day_g: Math.round(per_day_g),
    monthly_g: Math.round(monthly_g),
    per_trip_kg: parseFloat(per_trip_kg.toFixed(3)),
    per_day_kg: parseFloat(per_day_kg.toFixed(3)),
    monthly_kg: parseFloat(monthly_kg.toFixed(3)),
    saved_vs_car_per_trip_kg: saved_vs_car_per_trip_kg !== null ? parseFloat(saved_vs_car_per_trip_kg.toFixed(3)) : null,
    saved_vs_car_monthly_kg: saved_vs_car_monthly_kg !== null ? parseFloat(saved_vs_car_monthly_kg.toFixed(3)) : null,
    assumptions: {
      mode,
      emission_factor: factor,
      trips_per_day,
      days_per_month,
      passengers,
      distance_km,
    },
  };
}

/**
 * Helper function to calculate CO₂ saved per trip (for QR code scanning)
 * This is what gets added to user's total after each scan
 */
export function calculateCO2SavedPerTrip(
  distance_km: number,
  mode: TransportMode,
  passengers: number = 1
): number {
  if (distance_km < 0) return 0;

  const carEmission = distance_km * EMISSION_FACTORS.car;
  let modeEmission = distance_km * EMISSION_FACTORS[mode];

  // If carpooling, divide by passengers
  if (mode === 'car' && passengers > 1) {
    modeEmission = modeEmission / passengers;
  }

  const saved = carEmission - modeEmission;
  return Math.round(saved);
}

/**
 * Get friendly name for transport mode in Slovak
 */
export function getTransportModeName(mode: TransportMode): string {
  const names: Record<TransportMode, string> = {
    car: 'Auto',
    bus: 'Autobus',
    bike: 'Bicykel',
    walk: 'Chôdza',
  };
  return names[mode];
}

/**
 * Get emoji icon for transport mode
 */
export function getTransportModeIcon(mode: TransportMode): string {
  const icons: Record<TransportMode, string> = {
    car: '🚗',
    bus: '🚌',
    bike: '🚴',
    walk: '🚶',
  };
  return icons[mode];
}

/**
 * Format CO₂ amount with appropriate unit (g or kg)
 */
export function formatCO2(grams: number): string {
  if (grams < 1000) {
    return `${grams} g`;
  }
  return `${(grams / 1000).toFixed(1)} kg`;
}

