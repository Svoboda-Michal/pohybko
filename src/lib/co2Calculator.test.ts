/**
 * Unit tests for CO₂ Calculator
 * Testing 5 scenarios: car, bike, bus, invalid input, and carpool
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCO2,
  calculateCO2SavedPerTrip,
  validateInput,
  EMISSION_FACTORS,
  type CO2CalculationInput,
  type CO2CalculationResult,
} from './co2Calculator';

describe('CO₂ Calculator', () => {
  describe('Scenario 1: Car (single passenger)', () => {
    it('should calculate CO₂ emissions for car correctly', () => {
      const input: CO2CalculationInput = {
        mode: 'car',
        distance_km: 5,
        trips_per_day: 2,
        days_per_month: 20,
        passengers: 1,
      };

      const result = calculateCO2(input) as CO2CalculationResult;

      // Expected calculations:
      // per_trip_g = 5 * 150 = 750 g
      // per_day_g = 750 * 2 = 1500 g
      // monthly_g = 1500 * 20 = 30000 g
      expect(result.per_trip_g).toBe(750);
      expect(result.per_day_g).toBe(1500);
      expect(result.monthly_g).toBe(30000);
      expect(result.per_trip_kg).toBe(0.75);
      expect(result.per_day_kg).toBe(1.5);
      expect(result.monthly_kg).toBe(30);
      expect(result.saved_vs_car_per_trip_kg).toBeNull();
      expect(result.saved_vs_car_monthly_kg).toBeNull();
      expect(result.assumptions.emission_factor).toBe(150);
    });
  });

  describe('Scenario 2: Bike (zero emissions)', () => {
    it('should calculate CO₂ emissions and savings for bike', () => {
      const input: CO2CalculationInput = {
        mode: 'bike',
        distance_km: 3,
        trips_per_day: 2,
        days_per_month: 20,
        passengers: 1,
      };

      const result = calculateCO2(input) as CO2CalculationResult;

      // Expected calculations:
      // per_trip_g = 3 * 0 = 0 g
      // per_day_g = 0 * 2 = 0 g
      // monthly_g = 0 * 20 = 0 g
      // car_per_trip_g = 3 * 150 = 450 g
      // saved_per_trip = 450 - 0 = 450 g = 0.45 kg
      // saved_monthly = (450 * 2 * 20) - 0 = 18000 g = 18 kg
      expect(result.per_trip_g).toBe(0);
      expect(result.per_day_g).toBe(0);
      expect(result.monthly_g).toBe(0);
      expect(result.per_trip_kg).toBe(0);
      expect(result.per_day_kg).toBe(0);
      expect(result.monthly_kg).toBe(0);
      expect(result.saved_vs_car_per_trip_kg).toBe(0.45);
      expect(result.saved_vs_car_monthly_kg).toBe(18);
      expect(result.assumptions.emission_factor).toBe(0);
    });
  });

  describe('Scenario 3: Bus', () => {
    it('should calculate CO₂ emissions and savings for bus', () => {
      const input: CO2CalculationInput = {
        mode: 'bus',
        distance_km: 10,
        trips_per_day: 2,
        days_per_month: 20,
        passengers: 1,
      };

      const result = calculateCO2(input) as CO2CalculationResult;

      // Expected calculations:
      // per_trip_g = 10 * 80 = 800 g
      // per_day_g = 800 * 2 = 1600 g
      // monthly_g = 1600 * 20 = 32000 g
      // car_per_trip_g = 10 * 150 = 1500 g
      // saved_per_trip = 1500 - 800 = 700 g = 0.7 kg
      // car_monthly = 1500 * 2 * 20 = 60000 g
      // saved_monthly = 60000 - 32000 = 28000 g = 28 kg
      expect(result.per_trip_g).toBe(800);
      expect(result.per_day_g).toBe(1600);
      expect(result.monthly_g).toBe(32000);
      expect(result.per_trip_kg).toBe(0.8);
      expect(result.per_day_kg).toBe(1.6);
      expect(result.monthly_kg).toBe(32);
      expect(result.saved_vs_car_per_trip_kg).toBe(0.7);
      expect(result.saved_vs_car_monthly_kg).toBe(28);
      expect(result.assumptions.emission_factor).toBe(80);
    });
  });

  describe('Scenario 4: Invalid input', () => {
    it('should return error for negative distance', () => {
      const input: CO2CalculationInput = {
        mode: 'car',
        distance_km: -5,
      };

      const result = calculateCO2(input);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('nezáporná');
        expect(result.field).toBe('distance_km');
      }
    });

    it('should return error for invalid trips_per_day', () => {
      const input: CO2CalculationInput = {
        mode: 'bike',
        distance_km: 5,
        trips_per_day: 15,
      };

      const result = calculateCO2(input);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('medzi 1 a 10');
        expect(result.field).toBe('trips_per_day');
      }
    });

    it('should return error for invalid days_per_month', () => {
      const input: CO2CalculationInput = {
        mode: 'walk',
        distance_km: 2,
        days_per_month: 40,
      };

      const result = calculateCO2(input);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('medzi 1 a 31');
        expect(result.field).toBe('days_per_month');
      }
    });

    it('should return error for invalid passengers', () => {
      const input: CO2CalculationInput = {
        mode: 'car',
        distance_km: 5,
        passengers: 15,
      };

      const result = calculateCO2(input);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('medzi 1 a 10');
        expect(result.field).toBe('passengers');
      }
    });

    it('should return error for invalid mode', () => {
      const input = {
        mode: 'plane' as any,
        distance_km: 5,
      };

      const result = calculateCO2(input);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Neplatný typ dopravy');
        expect(result.field).toBe('mode');
      }
    });
  });

  describe('Scenario 5: Carpool (multiple passengers)', () => {
    it('should divide emissions by passenger count for carpooling', () => {
      const input: CO2CalculationInput = {
        mode: 'car',
        distance_km: 10,
        trips_per_day: 2,
        days_per_month: 20,
        passengers: 4,
      };

      const result = calculateCO2(input) as CO2CalculationResult;

      // Expected calculations:
      // base_car_per_trip = 10 * 150 = 1500 g
      // per_trip_g (with carpooling) = 1500 / 4 = 375 g
      // per_day_g = 375 * 2 = 750 g
      // monthly_g = 750 * 20 = 15000 g
      expect(result.per_trip_g).toBe(375);
      expect(result.per_day_g).toBe(750);
      expect(result.monthly_g).toBe(15000);
      expect(result.per_trip_kg).toBe(0.375);
      expect(result.per_day_kg).toBe(0.75);
      expect(result.monthly_kg).toBe(15);
      expect(result.saved_vs_car_per_trip_kg).toBeNull();
      expect(result.saved_vs_car_monthly_kg).toBeNull();
      expect(result.assumptions.passengers).toBe(4);
    });
  });

  describe('calculateCO2SavedPerTrip helper', () => {
    it('should calculate savings correctly for bike', () => {
      const saved = calculateCO2SavedPerTrip(5, 'bike');
      // car: 5 * 150 = 750
      // bike: 5 * 0 = 0
      // saved: 750 - 0 = 750
      expect(saved).toBe(750);
    });

    it('should calculate savings correctly for bus', () => {
      const saved = calculateCO2SavedPerTrip(5, 'bus');
      // car: 5 * 150 = 750
      // bus: 5 * 80 = 400
      // saved: 750 - 400 = 350
      expect(saved).toBe(350);
    });

    it('should calculate zero savings for car', () => {
      const saved = calculateCO2SavedPerTrip(5, 'car');
      expect(saved).toBe(0);
    });

    it('should handle carpooling', () => {
      const saved = calculateCO2SavedPerTrip(10, 'car', 3);
      // car: 10 * 150 = 1500
      // carpool: 1500 / 3 = 500
      // saved: 1500 - 500 = 1000
      expect(saved).toBe(1000);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero distance', () => {
      const input: CO2CalculationInput = {
        mode: 'car',
        distance_km: 0,
      };

      const result = calculateCO2(input) as CO2CalculationResult;
      expect(result.per_trip_g).toBe(0);
      expect(result.monthly_g).toBe(0);
    });

    it('should handle decimal distances', () => {
      const input: CO2CalculationInput = {
        mode: 'bike',
        distance_km: 2.5,
      };

      const result = calculateCO2(input) as CO2CalculationResult;
      expect(result.per_trip_g).toBe(0);
      expect(result.saved_vs_car_per_trip_kg).toBe(0.375); // 2.5 * 150 / 1000
    });

    it('should handle walk mode', () => {
      const input: CO2CalculationInput = {
        mode: 'walk',
        distance_km: 1.5,
        trips_per_day: 2,
        days_per_month: 20,
      };

      const result = calculateCO2(input) as CO2CalculationResult;
      expect(result.per_trip_g).toBe(0);
      expect(result.monthly_g).toBe(0);
      // saved vs car: 1.5 * 150 = 225 g per trip
      expect(result.saved_vs_car_per_trip_kg).toBe(0.225);
      // monthly: 225 * 2 * 20 = 9000 g = 9 kg
      expect(result.saved_vs_car_monthly_kg).toBe(9);
    });
  });
});

