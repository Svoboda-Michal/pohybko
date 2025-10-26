/**
 * CO₂ Calculator Page
 * Standalone page for students to calculate their carbon footprint
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseAuth } from '@/lib/supabaseAuth';
import { supabaseData } from '@/lib/supabaseData';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Co2Calculator from '@/components/Co2Calculator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCO2 } from '@/lib/co2Calculator';
import type { CO2CalculationResult } from '@/lib/co2Calculator';

export default function Co2CalculatorPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [calculationHistory, setCalculationHistory] = useState<any[]>([]);
  const [lastCalculation, setLastCalculation] = useState<CO2CalculationResult | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      const currentUser = await supabaseAuth.getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);

      // Load calculation history
      const history = await supabaseData.getUserCO2Calculations(currentUser.id, 5);
      setCalculationHistory(history);
    };

    loadUserData();
  }, [navigate]);

  const handleCalculationComplete = async (result: CO2CalculationResult) => {
    setLastCalculation(result);

    if (!user) return;

    // Save calculation to database
    const saved = await supabaseData.logCO2Calculation(
      user.id,
      user.schoolId,
      result.assumptions.mode as any,
      result.assumptions.distance_km,
      result.assumptions.trips_per_day,
      result.assumptions.days_per_month,
      result.assumptions.passengers,
      result.per_trip_g,
      result.per_day_g,
      result.monthly_g,
      result.saved_vs_car_per_trip_kg ? Math.round(result.saved_vs_car_per_trip_kg * 1000) : null,
      result.saved_vs_car_monthly_kg ? Math.round(result.saved_vs_car_monthly_kg * 1000) : null
    );

    if (saved) {
      toast({
        title: 'Výpočet uložený',
        description: 'Váš výpočet bol úspešne uložený do histórie.',
      });

      // Reload history
      const history = await supabaseData.getUserCO2Calculations(user.id, 5);
      setCalculationHistory(history);
      
      // Update lastCalculation state so dashboard shows it
      if (history.length > 0) {
        setLastCalculation(history[0]);
      }
    }
  };

  const handleSavePreferences = async () => {
    if (!user || !lastCalculation) {
      toast({
        title: 'Žiadny výpočet',
        description: 'Najprv vypočítajte emisie.',
        variant: 'destructive',
      });
      return;
    }

    const saved = await supabaseData.updateUserTransportPreferences(
      user.id,
      lastCalculation.assumptions.mode as any,
      lastCalculation.assumptions.passengers,
      lastCalculation.assumptions.trips_per_day,
      lastCalculation.assumptions.days_per_month
    );

    if (saved) {
      toast({
        title: 'Preferencie uložené',
        description: 'Vaše dopravné preferencie boli aktualizované. Presmerovávame vás na dashboard...',
      });
      
      // Notify dashboard to refresh
      window.dispatchEvent(new Event('calculationUpdated'));
      
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        navigate('/student');
      }, 1500);
    } else {
      toast({
        title: 'Chyba',
        description: 'Nepodarilo sa uložiť preferencie.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/student')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Späť
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">CO₂ Kalkulačka</h1>
              <p className="text-sm text-muted-foreground">Vypočítajte vašu uhlíkovú stopu</p>
            </div>
          </div>
          {lastCalculation && (
            <Button onClick={handleSavePreferences}>
              <Save className="w-4 h-4 mr-2" />
              Uložiť preferencie
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Co2Calculator
          defaultDistance={user?.distanceToSchoolKm}
          onCalculationComplete={handleCalculationComplete}
        />

        {calculationHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                História výpočtov
              </CardTitle>
              <CardDescription>Vaše posledné výpočty</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {calculationHistory.map((calc, index) => {
                  const date = new Date(calc.created_at);
                  const modeEmojis = {
                    car: '🚗',
                    bus: '🚌',
                    bike: '🚴',
                    walk: '🚶',
                  };

                  return (
                    <div
                      key={calc.id}
                      className={`p-4 rounded-lg border ${
                        index === 0 ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{modeEmojis[calc.mode as keyof typeof modeEmojis]}</span>
                            <Badge variant="outline">{calc.mode}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {calc.distance_km} km
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {date.toLocaleDateString('sk-SK', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{formatCO2(calc.monthly_g)}</div>
                          <div className="text-xs text-muted-foreground">za mesiac</div>
                          {calc.saved_vs_car_monthly_g && calc.saved_vs_car_monthly_g > 0 && (
                            <div className="text-sm text-green-600 font-medium">
                              ↓ {formatCO2(calc.saved_vs_car_monthly_g)} ušetrené
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle>💡 Vedeli ste?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              🌳 <strong>Jeden strom</strong> dokáže absorbovať približne <strong>10 kg CO₂ za rok</strong> (zdroj: spp.sk).
            </p>
            <p>
              🚴 <strong>Bicykel alebo chôdza</strong> produkuje <strong>0 emisií</strong> a pomáha vášmu zdraviu!
            </p>
            <p>
              🚌 <strong>Verejná doprava</strong> ušetrí až <strong>70g CO₂/km</strong> oproti autu.
            </p>
            <p>
              🚗 <strong>Spolucestovanie</strong> (carpool) môže znížiť vaše emisie až o <strong>75%</strong>!
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

