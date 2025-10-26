/**
 * CO₂ Calculator Component
 * Allows users to calculate their monthly CO₂ emissions and savings
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Leaf, Calculator, Info, TrendingDown, Users } from 'lucide-react';
import {
  calculateCO2,
  getTransportModeName,
  getTransportModeIcon,
  formatCO2,
  type TransportMode,
  type CO2CalculationResult,
  type CO2CalculationError,
} from '@/lib/co2Calculator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Co2CalculatorProps {
  defaultDistance?: number;
  onCalculationComplete?: (result: CO2CalculationResult) => void;
}

export default function Co2Calculator({ defaultDistance, onCalculationComplete }: Co2CalculatorProps) {
  const [mode, setMode] = useState<TransportMode>('bike');
  const [distance, setDistance] = useState<string>(defaultDistance?.toString() || '');
  const [tripsPerDay, setTripsPerDay] = useState<string>('2');
  const [daysPerMonth, setDaysPerMonth] = useState<string>('20');
  const [passengers, setPassengers] = useState<string>('1');
  const [result, setResult] = useState<CO2CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    setError(null);
    setResult(null);

    const calculation = calculateCO2({
      mode,
      distance_km: parseFloat(distance) || 0,
      trips_per_day: parseInt(tripsPerDay) || 2,
      days_per_month: parseInt(daysPerMonth) || 20,
      passengers: parseInt(passengers) || 1,
    });

    if ('error' in calculation) {
      setError((calculation as CO2CalculationError).error);
    } else {
      setResult(calculation as CO2CalculationResult);
      onCalculationComplete?.(calculation as CO2CalculationResult);
    }
  };

  // UI texts in Slovak
  const texts = {
    title: 'CO₂ Kalkulačka',
    subtitle: 'Vypočítajte vašu mesačnú uhlíkovú stopu',
    transportMode: 'Typ dopravy',
    distance: 'Vzdialenosť domov ↔ škola (km)',
    tripsPerDay: 'Počet ciest za deň',
    daysPerMonth: 'Počet dní v mesiaci',
    passengers: 'Počet cestujúcich (spolucestujúci)',
    calculate: 'Vypočítať',
    results: {
      perTrip: 'Na jednu cestu',
      perDay: 'Za deň',
      perMonth: 'Za mesiac',
      savings: 'Úspora oproti autu',
      perTripSavings: 'Úspora na cestu',
      monthlySavings: 'Mesačná úspora',
      noSavings: 'Používate auto - žiadna úspora',
    },
    assumptions: 'Predpoklady výpočtu',
    assumptionsTooltip: 'Emisný faktor: {factor} g CO₂/km\nCiest za deň: {trips}\nDní v mesiaci: {days}\nVzdialenosť: {distance} km',
    treesEquivalent: 'To je ako {trees} stromov za rok!',
    carpoolBenefit: 'Spolucestovaním ušetríte {savings} CO₂ mesačne!',
  };

  const treesEquivalent = result ? Math.round((result.saved_vs_car_monthly_kg || 0) * 12 / 10) : 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          {texts.title}
        </CardTitle>
        <CardDescription>{texts.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="mode">{texts.transportMode}</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as TransportMode)}>
              <SelectTrigger id="mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="walk">
                  {getTransportModeIcon('walk')} {getTransportModeName('walk')}
                </SelectItem>
                <SelectItem value="bike">
                  {getTransportModeIcon('bike')} {getTransportModeName('bike')}
                </SelectItem>
                <SelectItem value="bus">
                  {getTransportModeIcon('bus')} {getTransportModeName('bus')}
                </SelectItem>
                <SelectItem value="car">
                  {getTransportModeIcon('car')} {getTransportModeName('car')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="distance">{texts.distance}</Label>
            <Input
              id="distance"
              type="number"
              step="0.1"
              min="0"
              max="999"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="2.5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trips">{texts.tripsPerDay}</Label>
            <Input
              id="trips"
              type="number"
              min="1"
              max="10"
              value={tripsPerDay}
              onChange={(e) => setTripsPerDay(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="days">{texts.daysPerMonth}</Label>
            <Input
              id="days"
              type="number"
              min="1"
              max="31"
              value={daysPerMonth}
              onChange={(e) => setDaysPerMonth(e.target.value)}
            />
          </div>

          {mode === 'car' && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="passengers" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {texts.passengers}
              </Label>
              <Input
                id="passengers"
                type="number"
                min="1"
                max="10"
                value={passengers}
                onChange={(e) => setPassengers(e.target.value)}
              />
            </div>
          )}
        </div>

        <Button onClick={handleCalculate} className="w-full" size="lg">
          <Calculator className="w-4 h-4 mr-2" />
          {texts.calculate}
        </Button>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Chyba</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results Display */}
        {result && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="text-sm text-muted-foreground mb-1">{texts.results.perTrip}</div>
                <div className="text-2xl font-bold">{formatCO2(result.per_trip_g)}</div>
                <div className="text-xs text-muted-foreground mt-1">({result.per_trip_kg} kg)</div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="text-sm text-muted-foreground mb-1">{texts.results.perDay}</div>
                <div className="text-2xl font-bold">{formatCO2(result.per_day_g)}</div>
                <div className="text-xs text-muted-foreground mt-1">({result.per_day_kg} kg)</div>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="text-sm text-muted-foreground mb-1">{texts.results.perMonth}</div>
                <div className="text-2xl font-bold text-primary">{formatCO2(result.monthly_g)}</div>
                <div className="text-xs text-muted-foreground mt-1">({result.monthly_kg} kg)</div>
              </div>
            </div>

            {/* Savings Display */}
            {result.saved_vs_car_monthly_kg !== null && result.saved_vs_car_monthly_kg > 0 ? (
              <Alert className="border-green-200 bg-green-50">
                <Leaf className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">{texts.results.savings}</AlertTitle>
                <AlertDescription className="text-green-700">
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span>{texts.results.perTripSavings}:</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        {formatCO2((result.saved_vs_car_per_trip_kg || 0) * 1000)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{texts.results.monthlySavings}:</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-lg">
                        <TrendingDown className="w-4 h-4 mr-1" />
                        {result.saved_vs_car_monthly_kg.toFixed(1)} kg
                      </Badge>
                    </div>
                    {treesEquivalent > 0 && (
                      <p className="text-sm mt-2 flex items-center gap-1">
                        🌳 {texts.treesEquivalent.replace('{trees}', treesEquivalent.toString())}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ) : mode === 'car' && result.assumptions.passengers > 1 ? (
              <Alert className="border-blue-200 bg-blue-50">
                <Users className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Spolucestovanie</AlertTitle>
                <AlertDescription className="text-blue-700">
                  {texts.carpoolBenefit.replace(
                    '{savings}',
                    formatCO2((result.assumptions.distance_km * 150 - result.per_trip_g) * result.assumptions.trips_per_day * result.assumptions.days_per_month)
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>{texts.results.noSavings}</AlertTitle>
                <AlertDescription>
                  Skúste iné dopravné prostriedky pre nižšiu uhlíkovú stopu.
                </AlertDescription>
              </Alert>
            )}

            {/* Assumptions */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-1">
                      <Info className="w-4 h-4 mr-1" />
                      {texts.assumptions}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1 text-xs">
                      <div>Emisný faktor: {result.assumptions.emission_factor} g CO₂/km</div>
                      <div>Ciest za deň: {result.assumptions.trips_per_day}</div>
                      <div>Dní v mesiaci: {result.assumptions.days_per_month}</div>
                      <div>Vzdialenosť: {result.assumptions.distance_km} km</div>
                      {mode === 'car' && <div>Cestujúcich: {result.assumptions.passengers}</div>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

