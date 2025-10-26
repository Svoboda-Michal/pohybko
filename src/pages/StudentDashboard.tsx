import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseAuth } from '@/lib/supabaseAuth';
import { supabaseData } from '@/lib/supabaseData';
import { User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, LogOut, Hash, TrendingUp, Leaf, TreePine, Calculator, Edit, AlertCircle, LineChart, Users, School, Smile } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCO2, getTransportModeIcon, getTransportModeName } from '@/lib/co2Calculator';
import type { CO2CalculationResult } from '@/lib/co2Calculator';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [schoolLeaderboard, setSchoolLeaderboard] = useState<any[]>([]);
  const [stationCode, setStationCode] = useState('');
  const [lastCalculation, setLastCalculation] = useState<any | null>(null);
  const [calculationHistory, setCalculationHistory] = useState<any[]>([]);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [moodStats, setMoodStats] = useState<any | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      // Always fetch fresh data from database
      const currentUser = await supabaseAuth.getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      if (currentUser.role !== 'student') {
        navigate('/admin');
        return;
      }
      
      // Get fresh user data from database (not from cache)
      const students = await supabaseData.getSchoolUsers(currentUser.schoolId);
      const freshUser = students.find(s => s.id === currentUser.id) || currentUser;
      setUser(freshUser);

      // Get leaderboard with fresh data
      setLeaderboard(students);

      // Get school leaderboard
      const schools = await supabaseData.getSchoolLeaderboard();
      setSchoolLeaderboard(schools);

      // Get last calculation and history
      const history = await supabaseData.getUserCO2Calculations(currentUser.id, 10);
      console.log('📊 CO2 Calculation History loaded:', history.length, 'items');
      console.log('History data:', history);
      setCalculationHistory(history);
      if (history.length > 0) {
        setLastCalculation(history[0]);
        console.log('Latest calculation:', history[0]);
      } else {
        console.warn('⚠️ No calculation history found!');
      }

      // Get scan history for the chart
      const scans = await supabaseData.getUserScans(currentUser.id, 10);
      console.log('🔍 Scan History loaded:', scans.length, 'scans');
      setScanHistory(scans);

      // Get mood statistics
      const mood = await supabaseData.getUserMoodStats(currentUser.id);
      console.log('😊 Mood Stats loaded:', mood);
      setMoodStats(mood);
    };

    loadUserData();
    
    // Refresh every time window gets focus (when user returns from scan page)
    const handleFocus = () => {
      loadUserData();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Listen for localStorage changes (from calculator page)
    const handleStorageChange = () => {
      loadUserData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event
    const handleCalculationUpdate = () => {
      loadUserData();
    };
    
    window.addEventListener('calculationUpdated', handleCalculationUpdate);
    
    // Listen for scan completion
    const handleScanComplete = () => {
      console.log('Scan completed - refreshing dashboard');
      loadUserData();
    };
    
    window.addEventListener('scanCompleted', handleScanComplete);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('calculationUpdated', handleCalculationUpdate);
      window.removeEventListener('scanCompleted', handleScanComplete);
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabaseAuth.logout();
    toast({
        title: '👋 Ahoj!',
        description: 'Nezabudni sa vrátiť a zachrániť viac stromov!',
    });
    navigate('/login');
  };

  const handleCodeSubmit = async () => {
    if (!stationCode.trim() || stationCode.length !== 6) {
      toast({
        title: '🤔 Ups!',
        description: 'Zadaj prosím celý 6-ciferný kód (napríklad 123456)',
        variant: 'destructive',
      });
      return;
    }

    if (!user) return;

    // Try to find station by code
    const station = await supabaseData.getStationByCode(stationCode, user.schoolId);
    
    if (!station) {
      toast({
        title: '🔍 Hmmm...',
        description: 'Tento kód nepoznám. Skontroluj si ho ešte raz!',
        variant: 'destructive',
      });
      return;
    }

    // Navigate to station scan page
    navigate(`/station/${station.id}`);
  };

  const userRank = leaderboard.findIndex(u => u.id === user?.id) + 1;
  const nextRankPoints = leaderboard[userRank - 2]?.totalPoints || (user?.totalPoints || 0) + 50;
  const pointsToNext = Math.max(0, nextRankPoints - (user?.totalPoints || 0));
  
  // CO₂ from QR scans (from user profile) - THIS IS THE SINGLE SOURCE OF TRUTH
  const co2SavedKg = (user?.totalCo2SavedG || 0) / 1000;
  const treesSaved = Math.round((co2SavedKg * 12) / 10); // 1 tree = 10kg CO₂/year (zdroj: spp.sk)
  
  // Latest calculation values
  const co2ConsumedKg = lastCalculation ? lastCalculation.monthly_g / 1000 : 0;
  const treesConsumed = Math.round((co2ConsumedKg * 12) / 10);
  
  // Current CO₂ impact from last calculation
  const netCo2Kg = lastCalculation 
    ? (lastCalculation.saved_vs_car_monthly_g ? lastCalculation.saved_vs_car_monthly_g / 1000 : 0)
    : 0;
  const netTrees = Math.round((netCo2Kg * 12) / 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Compact Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/pohybko-logo.png" alt="Pohybko" className="h-8 sm:h-10" />
            <div>
              <p className="text-xs text-muted-foreground">Ahoj, {user?.name}!</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Odhlásiť</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Main Content */}
          <div className="flex-1 space-y-4">
        {/* Quick Stats Grid - Mobile First */}
        <div className="grid grid-cols-2 gap-3">
          {/* Points */}
          <Card className="border-primary/30">
            <CardContent className="pt-3 pb-3 px-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Award className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="text-xs font-medium text-muted-foreground">Tvoje body</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-primary">{user?.totalPoints || 0}</div>
              <Progress value={((user?.totalPoints || 0) / nextRankPoints) * 100} className="h-1 mt-1.5" />
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Do ďalšieho levelu: {pointsToNext}</p>
            </CardContent>
          </Card>

          {/* Rank */}
          <Card className="border-secondary/30 relative overflow-hidden">
            <CardContent className="pt-3 pb-3 px-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                <span className="text-xs font-medium text-muted-foreground">Tvoje umiestnenie</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-secondary">#{userRank}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5">z {leaderboard.length} súťažiacich</p>
              <img src="/2.png" alt="Walking Pohybko" className="absolute -bottom-2 -right-2 w-16 h-16 sm:w-20 sm:h-20 opacity-60" />
            </CardContent>
          </Card>

          {/* Trees - NOW BIG! */}
          <Card className="border-green-300 relative overflow-hidden">
            <CardContent className="pt-3 pb-3 px-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TreePine className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-xs font-medium text-muted-foreground">Zachránil si stromy</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-green-600">🌳 {treesSaved}</div>
              <p className="text-[10px] sm:text-xs text-green-700 mt-1.5">stromov ročne!</p>
              <img src="/3.png" alt="Peace Pohybko" className="absolute -bottom-2 -right-2 w-16 h-16 sm:w-20 sm:h-20 opacity-60" />
            </CardContent>
          </Card>

          {/* CO2 - now smaller */}
          <Card className="border-green-300">
            <CardContent className="pt-3 pb-3 px-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Leaf className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <span className="text-xs font-medium text-muted-foreground">CO₂ úspora</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-green-600">{co2SavedKg.toFixed(1)} kg</div>
              <p className="text-[10px] sm:text-xs text-green-700 mt-1.5">To je super!</p>
            </CardContent>
          </Card>
        </div>

        {/* CO2 Calculator - Compact */}
        {!lastCalculation ? (
          <Card className="border-orange-200 bg-orange-50/50 relative overflow-hidden">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-10 h-10 text-orange-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1">🧮 Zisti svoju CO₂ stopu!</h3>
                  <p className="text-xs text-muted-foreground mb-2">Koľko stromov potrebuješ na vyčistenie vzduchu? Zisti to!</p>
                  <Button onClick={() => navigate('/co2-calculator')} size="sm" className="bg-green-600 hover:bg-green-700">
                    <Calculator className="w-3 h-3 mr-1" />
                    Spočítaj to!
                  </Button>
                </div>
                <img src="/4.png" alt="Smart Pohybko" className="absolute -bottom-1 -right-1 w-20 h-20 sm:w-24 sm:h-24 opacity-50" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-300 bg-gradient-to-br from-green-50/30 to-green-100/30 relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-green-600" />
                  Tvoja cesta do školy
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigate('/co2-calculator')}>
                  <Edit className="w-3 h-3 mr-1" />
                  Zmeniť
                </Button>
              </div>
              {/* Playful Context */}
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <p className="text-xs text-blue-800">
                  💡 <strong>Vedel si?</strong> Každý dopravný prostriedok vypúšťa CO₂ do ovzdušia. Stromy ho potom čistia a menia na kyslík, ktorý dýchame! Čím viac stromov, tým čistejší vzduch 🌳
                </p>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              {/* Trees BIG, kg small */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-green-100 to-green-50 border border-green-300 relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-base font-medium text-green-800 mb-3">
                      🌳 Celý rok {treesConsumed === 1 ? 'maká' : 'makajú'} <strong>{treesConsumed} {treesConsumed === 1 ? 'strom' : treesConsumed < 5 ? 'stromy' : 'stromov'}</strong> na čistenie vzduchu za tvoju cestu!
                    </div>
                    <div className="text-4xl sm:text-5xl font-bold text-green-700 mb-3">🌳 {treesConsumed}</div>
                    <div className="text-xs text-green-700 mb-2">
                      {getTransportModeIcon(lastCalculation.mode as any)} {getTransportModeName(lastCalculation.mode as any)}
                      {lastCalculation.distance_km && ` • ${lastCalculation.distance_km} km`}
                    </div>
                    <div className="text-xs text-green-600 bg-white/60 rounded px-2 py-1 inline-block">
                      ({co2ConsumedKg.toFixed(1)} kg CO₂ mesačne)
                    </div>
                  </div>
                  <img src="/4.png" alt="Smart Pohybko" className="w-20 h-20 sm:w-24 sm:h-24 opacity-70 flex-shrink-0" />
                </div>
              </div>

              {/* Trip details */}
              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground text-center">
                <span className="font-medium">{lastCalculation.trips_per_day}x denne</span>
                {' • '}
                <span className="font-medium">{lastCalculation.days_per_month} dní v mesiaci</span>
                {lastCalculation.passengers > 1 && (
                  <>
                    {' • '}
                    <span className="font-medium">{lastCalculation.passengers} spolucestujúcich</span>
                  </>
                )}
              </div>
              
              {/* Source info */}
              <div className="mt-2 text-[10px] text-center text-muted-foreground/70">
                1 strom = 10 kg CO₂ ročne (zdroj: spp.sk)
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mood Stats Card */}
        {moodStats && moodStats.totalResponses > 0 && (
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50/30 to-pink-100/30 relative overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Smile className="w-4 h-4 text-purple-600" />
                😊 Tvoja nálada
              </CardTitle>
              <CardDescription className="text-xs">
                Priemer z {moodStats.totalResponses} {moodStats.totalResponses === 1 ? 'odpovede' : moodStats.totalResponses < 5 ? 'odpovedí' : 'odpovedí'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="bg-white/60 rounded-lg p-4 border border-purple-200">
                {/* Big Mood Display */}
                <div className="text-center mb-4">
                  <div className="text-6xl mb-2">
                    {moodStats.avgMood >= 4.5 ? '😄' : 
                     moodStats.avgMood >= 3.5 ? '😊' : 
                     moodStats.avgMood >= 2.5 ? '😐' : 
                     moodStats.avgMood >= 1.5 ? '😕' : '😞'}
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {moodStats.avgMood.toFixed(1)}/5
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {moodStats.avgMood >= 4 ? 'Výborne sa cítiš!' : 
                     moodStats.avgMood >= 3 ? 'Celkom v pohode!' : 
                     moodStats.avgMood >= 2 ? 'Mohlo by to byť lepšie' : 'Drž sa!'}
                  </div>
                </div>

                {/* Mood Distribution */}
                <div className="space-y-2">
                  {[
                    { emoji: '😄', count: moodStats.mood5Count, label: 'Výborne' },
                    { emoji: '😊', count: moodStats.mood4Count, label: 'Dobre' },
                    { emoji: '😐', count: moodStats.mood3Count, label: 'Okej' },
                    { emoji: '😕', count: moodStats.mood2Count, label: 'Zle' },
                    { emoji: '😞', count: moodStats.mood1Count, label: 'Veľmi zle' },
                  ].map((mood, index) => {
                    const percentage = moodStats.totalResponses > 0 
                      ? (mood.count / moodStats.totalResponses) * 100 
                      : 0;
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-xl w-6">{mood.emoji}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {mood.count}x
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-2">
                <p className="text-xs text-purple-700 text-center">
                  💚 Tvoj osobný mood tracker - sleduj, kedy si v top forme!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CO2 Savings History Chart */}
        <Card className="border-green-200 relative overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <LineChart className="w-4 h-4 text-green-600" />
              🌟 Tvoj pokrok
            </CardTitle>
            <CardDescription className="text-xs">
              {scanHistory.length > 0 
                ? `Urobil si ${scanHistory.length} skenov • Zachránil si ${treesSaved} stromov!`
                : 'Začni svoju cestu!'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {scanHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm relative">
                <img src="/1.png" alt="Happy Pohybko" className="w-20 h-20 mx-auto mb-3 opacity-60" />
                <p className="font-semibold">Tvoja cesta začína teraz!</p>
                <p className="text-xs mt-1">Naskenuj QR kód na stanici a začni pomáhať planéte 🌍</p>
              </div>
            ) : (
              <div>
                {/* Filled Line Chart */}
                <div className="relative h-48 sm:h-56 bg-gradient-to-t from-green-50 to-transparent rounded-lg p-4 border border-green-100">
                  {(() => {
                    const chartData = scanHistory.slice(0, 10).reverse();
                    const values = chartData.map((s: any) => s.co2SavedG || 0);
                    const maxValue = Math.max(...values, 1000);
                    const totalSaved = (user?.totalCo2SavedG || 0); // Single source of truth
                    
                    console.log('📊 Chart data:', { 
                      count: chartData.length, 
                      values, 
                      maxValue 
                    });
                    
                    // Calculate points for the line
                    const points = chartData.map((scan, index) => {
                      const saved = scan.co2SavedG || 0;
                      const x = (index / (chartData.length - 1)) * 100;
                      const y = 100 - ((saved / maxValue) * 80); // 80% max height for padding
                      return { x, y, saved, date: scan.timestamp };
                    });
                    
                    // Create SVG path for filled area
                    const pathD = points.length > 0
                      ? `M 0,100 L ${points.map((p, i) => `${p.x},${p.y}`).join(' L ')} L 100,100 Z`
                      : '';
                    
                    const lineD = points.length > 0
                      ? `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`
                      : '';
                    
                    return (
                      <>
                        {/* Total Stats - Top Left */}
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-green-200 z-10">
                          <div className="text-[10px] text-muted-foreground">Zachránil si</div>
                          <div className="text-2xl font-bold text-green-600">
                            🌳 {treesSaved}
                          </div>
                          <div className="text-[9px] text-green-600">
                            ({(totalSaved / 1000).toFixed(1)} kg CO₂)
                          </div>
                        </div>
                        
                        {/* SVG for the chart */}
                        <svg 
                          className="absolute inset-0 w-full h-full" 
                          viewBox="0 0 100 100" 
                          preserveAspectRatio="none"
                        >
                          {/* Filled area */}
                          <path
                            d={pathD}
                            fill="url(#greenGradient)"
                            opacity="0.6"
                          />
                          {/* Line */}
                          <path
                            d={lineD}
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="0.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Gradient definition */}
                          <defs>
                            <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
                              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.1" />
                            </linearGradient>
                          </defs>
                        </svg>
                        
                        {/* Data points with hover */}
                        <div className="absolute inset-0 flex items-end justify-between px-2 pb-6">
                          {points.map((point, index) => (
                            <div
                              key={chartData[index].id}
                              className="relative group flex-1 flex justify-center"
                              style={{ height: '100%' }}
                            >
                              {/* Hover point */}
                              <div
                                className="absolute"
                                style={{ 
                                  bottom: `${100 - point.y}%`,
                                }}
                              >
                                <div className="w-2.5 h-2.5 bg-green-600 rounded-full ring-2 ring-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-green-700 text-white text-xs px-2.5 py-1.5 rounded whitespace-nowrap z-10 shadow-lg">
                                  <div className="font-semibold">{(point.saved / 1000).toFixed(1)} kg CO₂</div>
                                  <div className="text-[10px] opacity-80">
                                    {new Date(point.date).toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* X-axis labels */}
                        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[9px] sm:text-[10px] text-muted-foreground">
                          {chartData.map((scan, index) => (
                            <div key={scan.id} className="flex-1 text-center">
                              {index === 0 || index === chartData.length - 1 || index === Math.floor(chartData.length / 2) ? (
                                new Date(scan.timestamp).toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric' })
                              ) : (
                                ''
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Station Code Input - Compact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" />
              🔢 Zadaj kód stanice
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground mb-3">
              Nájdi 6-ciferný kód pod QR kódom. Za každý check-in dostaneš <strong>10 bodov</strong> a kvíz za <strong>+5 bodov</strong>! 🎯
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="123456"
                value={stationCode}
                onChange={(e) => setStationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="font-mono text-base text-center"
              />
              <Button onClick={handleCodeSubmit} disabled={stationCode.length !== 6}>
                Skenovať!
              </Button>
            </div>
          </CardContent>
        </Card>

          </div>

          {/* Sidebar - Leaderboards */}
          <aside className="lg:w-80 xl:w-96 flex-shrink-0">
            <Card className="lg:sticky lg:top-20 relative overflow-hidden">
              <img src="/3.png" alt="Peace Pohybko" className="absolute top-2 right-2 w-16 h-16 opacity-30 pointer-events-none" />
              <CardHeader className="pb-3">
                <CardTitle className="text-base">🏆 Žebríček hrdinov</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Tabs defaultValue="students" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-3">
                    <TabsTrigger value="students" className="text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      Kamaráti
                    </TabsTrigger>
                    <TabsTrigger value="schools" className="text-xs">
                      <School className="w-3 h-3 mr-1" />
                      Školy
                    </TabsTrigger>
                  </TabsList>

                  {/* Students Leaderboard */}
                  <TabsContent value="students" className="mt-0">
                    <div className="space-y-2 max-h-[500px] lg:max-h-[600px] overflow-y-auto pr-1">
                      {leaderboard.slice(0, 20).map((student, index) => (
                        <div
                          key={student.id}
                          className={`flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                            student.id === user?.id ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                index === 0
                                  ? 'bg-yellow-400 text-yellow-900'
                                  : index === 1
                                  ? 'bg-gray-300 text-gray-700'
                                  : index === 2
                                  ? 'bg-orange-400 text-orange-900'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {index + 1}
                            </div>
                            <span className="font-medium truncate text-xs">{student.name}</span>
                            {student.id === user?.id && (
                              <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded flex-shrink-0">Ty</span>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="font-bold text-primary text-xs">{student.totalPoints} bodov</div>
                            <div className="text-[10px] text-green-600">
                              🌳 {Math.round(((student.totalCo2SavedG / 1000) * 12) / 10)} stromov
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Schools Leaderboard */}
                  <TabsContent value="schools" className="mt-0">
                    <div className="space-y-2 max-h-[500px] lg:max-h-[600px] overflow-y-auto pr-1">
                      {schoolLeaderboard.map((school, index) => (
                        <div
                          key={school.id}
                          className={`flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                            school.id === user?.schoolId ? 'bg-green-100 border border-green-300' : 'bg-muted/30 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                index === 0
                                  ? 'bg-yellow-400 text-yellow-900'
                                  : index === 1
                                  ? 'bg-gray-300 text-gray-700'
                                  : index === 2
                                  ? 'bg-orange-400 text-orange-900'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate text-xs">{school.name}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {school.studentCount} {school.studentCount === 1 ? 'študent' : school.studentCount < 5 ? 'študenti' : 'študentov'}
                              </div>
                            </div>
                            {school.id === user?.schoolId && (
                              <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded flex-shrink-0">Tvoja</span>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="font-bold text-primary text-xs">{school.totalPoints} b.</div>
                            <div className="text-[10px] text-green-600">
                              🌳 {Math.round(((school.totalCo2SavedG / 1000) * 12) / 10)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
