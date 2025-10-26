import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabaseAuth } from '@/lib/supabaseAuth';
import { supabaseData } from '@/lib/supabaseData';
import { verifyLocation } from '@/lib/geolocation';
import { Station, Quiz } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ArrowLeft, MapPin, Award, Leaf, TreePine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function StationScan() {
  const { stationId } = useParams<{ stationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [station, setStation] = useState<Station | null>(null);
  const [scanStatus, setScanStatus] = useState<'loading' | 'show-quiz' | 'ask-mood' | 'success' | 'error' | 'cooldown' | 'location-error' | 'no-quiz'>('loading');
  const [pointsEarned, setPointsEarned] = useState(0);
  const [co2SavedG, setCo2SavedG] = useState(0);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [userDistance, setUserDistance] = useState<number | null>(null);
  const [quizResponseId, setQuizResponseId] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  useEffect(() => {
    const loadStationData = async () => {
      const user = await supabaseAuth.getCurrentUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      if (user.role !== 'student') {
        toast({
          title: 'Prístup zamietnutý',
          description: 'Len študenti môžu skenovať stanice',
          variant: 'destructive',
        });
        navigate('/admin');
        return;
      }

      if (!stationId) {
        setScanStatus('error');
        return;
      }

      // Get station data
      const stations = await supabaseData.getStations(user.schoolId);
      const foundStation = stations.find(s => s.id === stationId);

      if (!foundStation) {
        setScanStatus('error');
        return;
      }

      setStation(foundStation);

      // Check if user can scan
      const canScan = await supabaseData.canScanStation(user.id, stationId);

      if (!canScan) {
        setScanStatus('cooldown');
        return;
      }

      // If station requires location verification, check location first
      if (foundStation.requireLocation && foundStation.latitude && foundStation.longitude) {
        const locationCheck = await verifyLocation(
          foundStation.latitude,
          foundStation.longitude,
          foundStation.locationRadiusMeters || 50
        );

        if (!locationCheck.verified) {
          setLocationError(locationCheck.error || 'Nepodarilo sa overiť polohu');
          setUserDistance(locationCheck.distance);
          setScanStatus('location-error');
          return;
        }

        // Location verified, store distance for display
        setUserDistance(locationCheck.distance);
      }

      // Get random quiz
      const randomQuiz = await supabaseData.getRandomQuiz(user.schoolId);
      
      if (!randomQuiz) {
        setScanStatus('no-quiz');
        return;
      }

      setQuiz(randomQuiz);
      setScanStatus('show-quiz');
    };

    loadStationData();
  }, [stationId, navigate, toast]);

  const handleAnswerSelect = async (answer: 'A' | 'B' | 'C') => {
    const user = await supabaseAuth.getCurrentUser();
    if (!user || !station || !quiz) return;

    setSelectedAnswer(answer);
    const correct = answer === quiz.correctAnswer;
    setIsCorrect(correct);
    
    // Record the quiz response
    const response = await supabaseData.recordQuizResponse(
      user.id,
      quiz.id,
      station.id,
      answer,
      quiz.correctAnswer,
      quiz.points
    );
    
    if (response) {
      setPointsEarned(response.pointsEarned);
      setQuizResponseId(response.id);
      
      // Record the scan with transport mode from user preferences or default to bike
      // This will calculate and save CO₂ saved based on their transport mode
      const transportMode = user.defaultTransportMode || 'bike'; // Default to bike if not set
      const scan = await supabaseData.recordScan(user.id, station.id, transportMode, station.pointsValue);
      
      if (scan) {
        setCo2SavedG(scan.co2SavedG);
      }
      
      // Show mood selection instead of success
      setScanStatus('ask-mood');

      if (correct) {
        toast({
          title: 'Správna odpoveď!',
          description: `Získali ste ${response.pointsEarned} bodov z kvízu!`,
        });
      } else {
        toast({
          title: 'Nesprávna odpoveď',
          description: 'Bohužiaľ, odpoveď nebola správna. Budúcu otázku určite zvládnete!',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Chyba',
        description: 'Nepodarilo sa zaznamenať odpoveď. Skúste to znova.',
        variant: 'destructive',
      });
    }
  };

  const handleMoodSelect = async (mood: number) => {
    setSelectedMood(mood);
    
    // Update the quiz response with mood
    if (quizResponseId) {
      const success = await supabaseData.updateQuizResponseMood(quizResponseId, mood);
      
      if (success) {
        console.log('✅ Mood recorded:', mood);
      }
    }
    
    // Show success screen
    setScanStatus('success');
    
    // Notify dashboard to refresh
    window.dispatchEvent(new Event('scanCompleted'));
  };

  const renderContent = () => {
    switch (scanStatus) {
      case 'loading':
        return (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Spracovávam skenovanie...</p>
          </div>
        );

      case 'ask-mood':
        const moodEmojis = ['😞', '😕', '😐', '😊', '😄'];
        const moodLabels = ['Veľmi zle', 'Zle', 'Okej', 'Dobre', 'Výborne'];
        const moodColors = ['bg-red-100 hover:bg-red-200 border-red-300', 'bg-orange-100 hover:bg-orange-200 border-orange-300', 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300', 'bg-green-100 hover:bg-green-200 border-green-300', 'bg-blue-100 hover:bg-blue-200 border-blue-300'];
        
        return (
          <div className="py-6 space-y-6">
            <div className="text-center">
              <img src="/1.png" alt="Happy Pohybko" className="w-20 h-20 mx-auto mb-3" />
              <h2 className="text-2xl font-bold mb-2">Tvoj mood dnes? 🎯</h2>
              <p className="text-muted-foreground">Sleduj svoju náladu a zisti, ako sa cítiš pri aktivite! ⚡</p>
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((mood) => (
                <button
                  key={mood}
                  onClick={() => handleMoodSelect(mood)}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${moodColors[mood - 1]} ${selectedMood === mood ? 'ring-4 ring-primary scale-105' : ''}`}
                >
                  <span className="text-4xl mb-2">{moodEmojis[mood - 1]}</span>
                  <span className="text-xs font-medium text-center">{moodLabels[mood - 1]}</span>
                </button>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700 text-center">
                📊 Tvoj osobný mood tracker - zisti, kedy sa cítiš najlepšie!
              </p>
            </div>
          </div>
        );

      case 'show-quiz':
        return (
          <div className="py-6 space-y-6">
            <div className="text-center">
              <Award className="w-12 h-12 text-primary mx-auto mb-3" />
              <h2 className="text-2xl font-bold mb-2">Kvízová otázka</h2>
              <p className="text-muted-foreground">Odpovedzte správne a získajte {quiz?.points || 5} bodov!</p>
            </div>
            
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-lg font-medium text-center">{quiz?.question}</p>
            </div>
            
            <div className="grid gap-3">
              <Button
                variant="outline"
                className="h-auto min-h-[60px] justify-start text-left whitespace-normal p-4"
                onClick={() => handleAnswerSelect('A')}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-blue-600 font-bold">A</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{quiz?.optionA}</p>
                  </div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto min-h-[60px] justify-start text-left whitespace-normal p-4"
                onClick={() => handleAnswerSelect('B')}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-600 font-bold">B</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{quiz?.optionB}</p>
                  </div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto min-h-[60px] justify-start text-left whitespace-normal p-4"
                onClick={() => handleAnswerSelect('C')}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-orange-600 font-bold">C</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{quiz?.optionC}</p>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        );

      case 'success':
        const co2SavedKg = co2SavedG / 1000;
        const treesEquivalent = Math.round((co2SavedKg * 12) / 10);
        
        return (
          <div className="text-center py-8 space-y-4">
            {isCorrect ? (
              <>
                <img src="/3.png" alt="Peace Pohybko" className="w-32 h-32 mx-auto" />
                <div>
                  <h2 className="text-3xl font-bold text-success mb-2">+{pointsEarned} bodov!</h2>
                  <p className="text-muted-foreground">Správna odpoveď na {station?.name}</p>
                </div>
                
                <div className="bg-success/10 border border-success/20 rounded-lg p-4 max-w-sm mx-auto">
                  <div className="flex items-center justify-center gap-2 text-success mb-2">
                    <Award className="w-5 h-5" />
                    <span className="font-semibold">Výborne!</span>
                  </div>
                  <p className="text-sm">
                    Správna odpoveď bola: <strong>{selectedAnswer}</strong>
                  </p>
                </div>

                {/* CO₂ Saved Display */}
                {co2SavedG > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-sm mx-auto">
                    <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
                      <Leaf className="w-5 h-5" />
                      <span className="font-semibold">🌍 Zachránil si planétu!</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      +{co2SavedKg.toFixed(2)} kg CO₂
                    </p>
                    <div className="flex items-center justify-center gap-1 text-sm text-green-600 mt-1">
                      <TreePine className="w-4 h-4" />
                      <span>~{treesEquivalent} {treesEquivalent === 1 ? 'strom' : treesEquivalent < 5 ? 'stromy' : 'stromov'} ročne</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Za túto cestu aktívnou dopravou!
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <XCircle className="w-20 h-20 text-destructive mx-auto" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">Nesprávna odpoveď</h2>
                  <p className="text-muted-foreground">Skenovanie na {station?.name}</p>
                </div>
                
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 max-w-sm mx-auto">
                  <p className="text-sm">
                    Správna odpoveď bola: <strong>{quiz?.correctAnswer}</strong>
                  </p>
                  <p className="text-sm mt-2 text-muted-foreground">
                    Budúcu otázku určite zvládnete!
                  </p>
                </div>

                {/* CO₂ Saved Display even on wrong answer */}
                {co2SavedG > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-sm mx-auto">
                    <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
                      <Leaf className="w-5 h-5" />
                      <span className="font-semibold">🌍 Zachránil si planétu!</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      +{co2SavedKg.toFixed(2)} kg CO₂
                    </p>
                    <div className="flex items-center justify-center gap-1 text-sm text-green-600 mt-1">
                      <TreePine className="w-4 h-4" />
                      <span>~{treesEquivalent} {treesEquivalent === 1 ? 'strom' : treesEquivalent < 5 ? 'stromy' : 'stromov'} ročne</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Za túto cestu aktívnou dopravou!
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'no-quiz':
        return (
          <div className="text-center py-8 space-y-4">
            <XCircle className="w-20 h-20 text-warning mx-auto" />
            <div>
              <h2 className="text-2xl font-bold mb-2">Žiadne kvízy</h2>
              <p className="text-muted-foreground">
                Administrátor ešte nevytvoril žiadne kvízy.
              </p>
            </div>
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 max-w-sm mx-auto">
              <p className="text-sm">
                Kontaktujte administrátora aby pridal kvízové otázky.
              </p>
            </div>
          </div>
        );

      case 'cooldown':
        return (
          <div className="text-center py-8 space-y-4">
            <XCircle className="w-20 h-20 text-warning mx-auto" />
            <div>
              <h2 className="text-2xl font-bold mb-2">Už skenované</h2>
              <p className="text-muted-foreground">
                Už ste nedávno skenovali {station?.name}.
              </p>
            </div>
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 max-w-sm mx-auto">
              <p className="text-sm">
                Môžete skenovať túto stanicu znova za niekoľko hodín. Skúste skenovať inú stanicu!
              </p>
            </div>
          </div>
        );

      case 'location-error':
        return (
          <div className="text-center py-8 space-y-4">
            <MapPin className="w-20 h-20 text-destructive mx-auto" />
            <div>
              <h2 className="text-2xl font-bold mb-2">Nesprávna poloha</h2>
              <p className="text-muted-foreground">
                {locationError}
              </p>
            </div>
            {userDistance && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 max-w-sm mx-auto">
                <p className="text-sm">
                  Vaša vzdialenosť od stanice: <strong>{Math.round(userDistance)}m</strong>
                </p>
                <p className="text-sm mt-2">
                  Potrebujete byť do {station?.locationRadiusMeters || 50}m od stanice pre skenovanie.
                </p>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm mx-auto">
              <div className="flex items-center gap-2 text-blue-800 mb-2">
                <MapPin className="w-5 h-5" />
                <span className="font-semibold">Tip</span>
              </div>
              <p className="text-sm text-blue-700">
                Uistite sa, že ste pri fyzickej stanici a máte povolený prístup k polohe vo vašom prehliadači.
              </p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8 space-y-4">
            <XCircle className="w-20 h-20 text-destructive mx-auto" />
            <div>
              <h2 className="text-2xl font-bold mb-2">Neplatná stanica</h2>
              <p className="text-muted-foreground">
                Táto stanica neexistuje alebo k nej nemáte prístup.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Skenovanie stanice</CardTitle>
          <CardDescription>
            {station ? `Skenovanie na ${station.name}` : 'Spracovávam vaše skenovanie...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
          <div className="mt-6 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Späť na panel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
