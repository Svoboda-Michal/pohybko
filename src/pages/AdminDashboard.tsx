import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseAuth } from '@/lib/supabaseAuth';
import { supabaseData } from '@/lib/supabaseData';
import { getCurrentLocation } from '@/lib/geolocation';
import { User, Station, Quiz } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LogOut, Plus, QrCode, Trash2, Users, MapPin, TrendingUp, Leaf, TreePine, Navigation, Award, Edit, Save, X, Calculator, Smile } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [schoolMoodStats, setSchoolMoodStats] = useState<any | null>(null);
  
  // Station creation state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const [newStationLatitude, setNewStationLatitude] = useState('');
  const [newStationLongitude, setNewStationLongitude] = useState('');
  const [requireLocation, setRequireLocation] = useState(true);
  const [locationRadius, setLocationRadius] = useState('50');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Station editing state
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [editStationName, setEditStationName] = useState('');
  const [editStationLatitude, setEditStationLatitude] = useState('');
  const [editStationLongitude, setEditStationLongitude] = useState('');
  const [editRequireLocation, setEditRequireLocation] = useState(false);
  const [editLocationRadius, setEditLocationRadius] = useState('50');
  
  // Quiz creation state
  const [isCreateQuizDialogOpen, setIsCreateQuizDialogOpen] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptionA, setQuizOptionA] = useState('');
  const [quizOptionB, setQuizOptionB] = useState('');
  const [quizOptionC, setQuizOptionC] = useState('');
  const [quizCorrectAnswer, setQuizCorrectAnswer] = useState<'A' | 'B' | 'C'>('A');
  
  // Quiz editing state
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [editQuizQuestion, setEditQuizQuestion] = useState('');
  const [editQuizOptionA, setEditQuizOptionA] = useState('');
  const [editQuizOptionB, setEditQuizOptionB] = useState('');
  const [editQuizOptionC, setEditQuizOptionC] = useState('');
  const [editQuizCorrectAnswer, setEditQuizCorrectAnswer] = useState<'A' | 'B' | 'C'>('A');

  useEffect(() => {
    const loadAdminData = async () => {
      const currentUser = await supabaseAuth.getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      if (currentUser.role !== 'admin') {
        navigate('/dashboard');
        return;
      }
      setUser(currentUser);
      loadData(currentUser.schoolId);
    };

    loadAdminData();
  }, [navigate]);

  const loadData = async (schoolId: string) => {
    const stationsList = await supabaseData.getStations(schoolId);
    setStations(stationsList);

    const quizzesList = await supabaseData.getQuizzes(schoolId);
    setQuizzes(quizzesList);

    const students = await supabaseData.getSchoolUsers(schoolId);
    setLeaderboard(students);

    const moodStats = await supabaseData.getSchoolMoodStats(schoolId);
    setSchoolMoodStats(moodStats);
  };

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    const location = await getCurrentLocation();
    setIsGettingLocation(false);
    
    if (location) {
      setNewStationLatitude(location.latitude.toFixed(8));
      setNewStationLongitude(location.longitude.toFixed(8));
      toast({
        title: 'Poloha získaná',
        description: 'Vaša aktuálna poloha bola nastavená pre stanicu',
      });
    } else {
      toast({
        title: 'Chyba',
        description: 'Nepodarilo sa získať polohu. Skontrolujte povolenia prehliadača.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateStation = async () => {
    if (!newStationName.trim() || !user) return;

    // Validate coordinates if location is required
    if (requireLocation) {
      if (!newStationLatitude || !newStationLongitude) {
        toast({
          title: 'Chyba',
          description: 'Zadajte súradnice alebo použite tlačidlo "Použiť moju polohu"',
          variant: 'destructive',
        });
        return;
      }

      const lat = parseFloat(newStationLatitude);
      const lng = parseFloat(newStationLongitude);
      const radius = parseInt(locationRadius);

      if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
        toast({
          title: 'Chyba',
          description: 'Neplatné súradnice alebo polomer',
          variant: 'destructive',
        });
        return;
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        toast({
          title: 'Chyba',
          description: 'Súradnice musia byť v platnom rozsahu',
          variant: 'destructive',
        });
        return;
      }
    }

    const coordinates = requireLocation && newStationLatitude && newStationLongitude
      ? {
          latitude: parseFloat(newStationLatitude),
          longitude: parseFloat(newStationLongitude),
        }
      : undefined;

    const newStation = await supabaseData.createStation(
      newStationName,
      user.schoolId,
      10,
      coordinates,
      requireLocation,
      parseInt(locationRadius)
    );
    
    if (newStation) {
      toast({
        title: 'Stanica vytvorená',
        description: `${newStation.name} je teraz aktívna`,
      });
      setNewStationName('');
      setNewStationLatitude('');
      setNewStationLongitude('');
      setRequireLocation(true);
      setLocationRadius('50');
      setIsCreateDialogOpen(false);
      loadData(user.schoolId);
    } else {
      toast({
        title: 'Chyba',
        description: 'Nepodarilo sa vytvoriť stanicu',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteStation = async (stationId: string, stationName: string) => {
    await supabaseData.deleteStation(stationId);
    toast({
        title: 'Stanica vymazaná',
        description: `${stationName} bola odstránená`,
    });
    if (user) loadData(user.schoolId);
  };

  const handleEditStation = (station: Station) => {
    setEditingStation(station);
    setEditStationName(station.name);
    setEditStationLatitude(station.latitude?.toString() || '');
    setEditStationLongitude(station.longitude?.toString() || '');
    setEditRequireLocation(station.requireLocation || false);
    setEditLocationRadius(station.locationRadiusMeters?.toString() || '50');
  };

  const handleSaveStation = async () => {
    if (!editingStation || !user) return;

    const updates: Partial<Station> = {
      name: editStationName,
      requireLocation: editRequireLocation,
    };

    if (editRequireLocation) {
      if (editStationLatitude && editStationLongitude) {
        updates.latitude = parseFloat(editStationLatitude);
        updates.longitude = parseFloat(editStationLongitude);
        updates.locationRadiusMeters = parseInt(editLocationRadius);
      }
    }

    await supabaseData.updateStation(editingStation.id, updates);
    
    toast({
      title: 'Stanica aktualizovaná',
      description: `${editStationName} bola úspešne aktualizovaná`,
    });
    
    setEditingStation(null);
    loadData(user.schoolId);
  };

  const handleCancelEditStation = () => {
    setEditingStation(null);
  };

  const handleCreateQuiz = async () => {
    if (!quizQuestion.trim() || !quizOptionA.trim() || !quizOptionB.trim() || !quizOptionC.trim() || !user) {
      toast({
        title: 'Chyba',
        description: 'Vyplňte všetky polia kvízu',
        variant: 'destructive',
      });
      return;
    }

    const newQuiz = await supabaseData.createQuiz(
      user.schoolId,
      quizQuestion,
      quizOptionA,
      quizOptionB,
      quizOptionC,
      quizCorrectAnswer,
      5
    );

    if (newQuiz) {
      toast({
        title: 'Kvíz vytvorený',
        description: 'Nová kvízová otázka bola pridaná',
      });
      setQuizQuestion('');
      setQuizOptionA('');
      setQuizOptionB('');
      setQuizOptionC('');
      setQuizCorrectAnswer('A');
      setIsCreateQuizDialogOpen(false);
      loadData(user.schoolId);
    } else {
      toast({
        title: 'Chyba',
        description: 'Nepodarilo sa vytvoriť kvíz',
        variant: 'destructive',
      });
    }
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setEditQuizQuestion(quiz.question);
    setEditQuizOptionA(quiz.optionA);
    setEditQuizOptionB(quiz.optionB);
    setEditQuizOptionC(quiz.optionC);
    setEditQuizCorrectAnswer(quiz.correctAnswer);
  };

  const handleSaveQuiz = async () => {
    if (!editingQuiz || !user) return;

    const success = await supabaseData.updateQuiz(editingQuiz.id, {
      question: editQuizQuestion,
      optionA: editQuizOptionA,
      optionB: editQuizOptionB,
      optionC: editQuizOptionC,
      correctAnswer: editQuizCorrectAnswer,
    });

    if (success) {
      toast({
        title: 'Kvíz aktualizovaný',
        description: 'Kvízová otázka bola úspešne aktualizovaná',
      });
      setEditingQuiz(null);
      loadData(user.schoolId);
    } else {
      toast({
        title: 'Chyba',
        description: 'Nepodarilo sa aktualizovať kvíz',
        variant: 'destructive',
      });
    }
  };

  const handleCancelEditQuiz = () => {
    setEditingQuiz(null);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    const success = await supabaseData.deleteQuiz(quizId);
    
    if (success) {
      toast({
        title: 'Kvíz vymazaný',
        description: 'Kvízová otázka bola odstránená',
      });
      if (user) loadData(user.schoolId);
    } else {
      toast({
        title: 'Chyba',
        description: 'Nepodarilo sa vymazať kvíz',
        variant: 'destructive',
      });
    }
  };

  const handleToggleQuizActive = async (quiz: Quiz) => {
    const success = await supabaseData.updateQuiz(quiz.id, {
      isActive: !quiz.isActive,
    });

    if (success) {
      toast({
        title: quiz.isActive ? 'Kvíz deaktivovaný' : 'Kvíz aktivovaný',
        description: `Kvíz je teraz ${!quiz.isActive ? 'aktívny' : 'neaktívny'}`,
      });
      if (user) loadData(user.schoolId);
    }
  };

  const handleLogout = async () => {
    await supabaseAuth.logout();
    toast({
        title: 'Odhlásený',
        description: 'Vidíme sa nabudúce!',
    });
    navigate('/login');
  };

  const copyStationUrl = (stationId: string) => {
    const url = `${window.location.origin}/station/${stationId}`;
    navigator.clipboard.writeText(url);
    toast({
        title: 'URL skopírovaná',
        description: 'URL stanice skopírovaná do schránky. Použite ju na vygenerovanie QR kódu.',
    });
  };

  const totalScans = stations.reduce((sum, s) => sum + s.totalScans, 0);
  
  // Calculate CO2 from students, not stations (students have the accurate totals)
  const totalCo2Saved = leaderboard.reduce((sum, s) => sum + (s.totalCo2SavedG || 0), 0);
  const totalCo2SavedKg = totalCo2Saved / 1000;
  const totalTreesEquivalent = Math.round((totalCo2SavedKg * 12) / 10); // Annual equivalent (1 tree = 10kg CO₂/year, zdroj: spp.sk)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/pohybko-logo.png" alt="Pohybko" className="h-12" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Panel Gamča</h1>
              <p className="text-sm text-muted-foreground">Spravujte pohybko vašej školy</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Odhlásenie
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid gap-6 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Celkové stanice</CardTitle>
              <MapPin className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stations.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Celkové skenovania</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalScans}</div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">CO₂ ušetrené</CardTitle>
              <Leaf className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totalCo2SavedKg.toFixed(1)} kg</div>
              <div className="flex items-center gap-1 text-green-700 mt-1">
                <TreePine className="w-3 h-3" />
                <p className="text-xs font-medium">
                  ~{totalTreesEquivalent} {totalTreesEquivalent === 1 ? 'strom' : totalTreesEquivalent < 5 ? 'stromy' : 'stromov'} ročne
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Celková úspora školy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Aktívni študenti</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leaderboard.length}</div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Priemer nálady</CardTitle>
              <Smile className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {schoolMoodStats && schoolMoodStats.totalResponses > 0 ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">
                      {schoolMoodStats.avgMood >= 4.5 ? '😄' : 
                       schoolMoodStats.avgMood >= 3.5 ? '😊' : 
                       schoolMoodStats.avgMood >= 2.5 ? '😐' : 
                       schoolMoodStats.avgMood >= 1.5 ? '😕' : '😞'}
                    </span>
                    <div className="text-2xl font-bold text-purple-600">
                      {schoolMoodStats.avgMood.toFixed(1)}/5
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {schoolMoodStats.totalResponses} {schoolMoodStats.totalResponses === 1 ? 'odpoveď' : schoolMoodStats.totalResponses < 5 ? 'odpovede' : 'odpovedí'}
                  </p>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Žiadne dáta</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Stanice</CardTitle>
                <CardDescription>Spravujte lokality skenovania QR kódov</CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Pridať stanicu
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Vytvoriť novú stanicu</DialogTitle>
                    <DialogDescription>
                      Pridajte novú lokalitu kde študenti môžu skenovať QR kódy
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="station-name">Názov stanice</Label>
                      <Input
                        id="station-name"
                        placeholder="napr. Hlavná školská brána"
                        value={newStationName}
                        onChange={(e) => setNewStationName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="require-location" className="text-base">
                            Vyžadovať polohu
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Študenti musia byť fyzicky pri stanici pre skenovanie
                          </p>
                        </div>
                        <Switch
                          id="require-location"
                          checked={requireLocation}
                          onCheckedChange={setRequireLocation}
                        />
                      </div>

                      {requireLocation && (
                        <div className="space-y-4 pt-3 border-t">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={handleGetCurrentLocation}
                              disabled={isGettingLocation}
                            >
                              <Navigation className="w-4 h-4 mr-2" />
                              {isGettingLocation ? 'Získavam polohu...' : 'Použiť moju polohu'}
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="latitude">Zemepisná šírka</Label>
                              <Input
                                id="latitude"
                                placeholder="48.148598"
                                value={newStationLatitude}
                                onChange={(e) => setNewStationLatitude(e.target.value)}
                                type="number"
                                step="0.00000001"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="longitude">Zemepisná dĺžka</Label>
                              <Input
                                id="longitude"
                                placeholder="17.107748"
                                value={newStationLongitude}
                                onChange={(e) => setNewStationLongitude(e.target.value)}
                                type="number"
                                step="0.00000001"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="radius">Povolený polomer (metre)</Label>
                            <Input
                              id="radius"
                              placeholder="50"
                              value={locationRadius}
                              onChange={(e) => setLocationRadius(e.target.value)}
                              type="number"
                              min="5"
                              max="500"
                            />
                            <p className="text-xs text-muted-foreground">
                              Študenti musia byť do {locationRadius}m od stanovených súradníc
                            </p>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-blue-600 mt-0.5" />
                              <div className="text-xs text-blue-700">
                                <p className="font-semibold mb-1">Ako získať súradnice:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                  <li>Použite tlačidlo "Použiť moju polohu" ak ste pri stanici</li>
                                  <li>Alebo nájdite lokalitu v Google Maps a kliknite pravým tlačidlom</li>
                                  <li>Súradnice sa zobrazia navrchu (napr. 48.148598, 17.107748)</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button onClick={handleCreateStation} className="w-full">
                      Vytvoriť stanicu
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stations.map((station) => (
                <div
                  key={station.id}
                  className="p-4 bg-muted/50 rounded-lg border border-border"
                >
                  {editingStation?.id === station.id ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Názov stanice</Label>
                        <Input
                          value={editStationName}
                          onChange={(e) => setEditStationName(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Vyžadovať polohu</Label>
                          <Switch
                            checked={editRequireLocation}
                            onCheckedChange={setEditRequireLocation}
                          />
                        </div>
                      </div>

                      {editRequireLocation && (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <Label>Zemepisná šírka</Label>
                              <Input
                                value={editStationLatitude}
                                onChange={(e) => setEditStationLatitude(e.target.value)}
                                type="number"
                                step="0.00000001"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Zemepisná dĺžka</Label>
                              <Input
                                value={editStationLongitude}
                                onChange={(e) => setEditStationLongitude(e.target.value)}
                                type="number"
                                step="0.00000001"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Polomer (metre)</Label>
                            <Input
                              value={editLocationRadius}
                              onChange={(e) => setEditLocationRadius(e.target.value)}
                              type="number"
                            />
                          </div>
                        </>
                      )}

                      <div className="flex gap-2">
                        <Button onClick={handleSaveStation} size="sm">
                          <Save className="w-4 h-4 mr-1" />
                          Uložiť
                        </Button>
                        <Button onClick={handleCancelEditStation} variant="outline" size="sm">
                          <X className="w-4 h-4 mr-1" />
                          Zrušiť
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{station.name}</h3>
                          {station.requireLocation && (
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              <MapPin className="w-3 h-3" />
                              Poloha vyžadovaná
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {station.totalScans} skenovaní • {station.pointsValue} bodov za skenovanie
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-primary">
                            <span className="text-xs font-mono font-bold bg-primary/10 px-2 py-1 rounded">
                              Kód: {station.stationCode}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-green-600">
                            <Leaf className="w-3 h-3" />
                            <span className="text-xs font-medium">
                              {(station.totalCo2SavedG / 1000).toFixed(1)} kg CO₂
                            </span>
                            <TreePine className="w-3 h-3" />
                            <span className="text-xs text-muted-foreground">
                              (~{Math.round((station.totalCo2SavedG / 1000 * 12) / 10)} stromov)
                            </span>
                          </div>
                          {station.requireLocation && station.latitude && station.longitude && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <MapPin className="w-3 h-3" />
                              <span className="text-xs font-medium">
                                {station.locationRadiusMeters}m polomer
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditStation(station)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Upraviť
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyStationUrl(station.id)}
                        >
                          <QrCode className="w-4 h-4 mr-1" />
                          URL
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteStation(station.id, station.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {stations.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Žiadne stanice zatiaľ. Vytvorte svoju prvú stanicu na začatie!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Kvízové otázky</CardTitle>
                <CardDescription>Spravujte kvízy pre študentov</CardDescription>
              </div>
              <Dialog open={isCreateQuizDialogOpen} onOpenChange={setIsCreateQuizDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Pridať kvíz
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Vytvoriť novú kvízovú otázku</DialogTitle>
                    <DialogDescription>
                      Pridajte ABC kvíz pre študentov. Správna odpoveď = 5 bodov.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="quiz-question">Otázka</Label>
                      <Textarea
                        id="quiz-question"
                        placeholder="Napíšte kvízovú otázku..."
                        value={quizQuestion}
                        onChange={(e) => setQuizQuestion(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quiz-option-a">Odpoveď A</Label>
                      <Input
                        id="quiz-option-a"
                        placeholder="Prvá možnosť odpovede"
                        value={quizOptionA}
                        onChange={(e) => setQuizOptionA(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quiz-option-b">Odpoveď B</Label>
                      <Input
                        id="quiz-option-b"
                        placeholder="Druhá možnosť odpovede"
                        value={quizOptionB}
                        onChange={(e) => setQuizOptionB(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quiz-option-c">Odpoveď C</Label>
                      <Input
                        id="quiz-option-c"
                        placeholder="Tretia možnosť odpovede"
                        value={quizOptionC}
                        onChange={(e) => setQuizOptionC(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quiz-correct-answer">Správna odpoveď</Label>
                      <Select
                        value={quizCorrectAnswer}
                        onValueChange={(value: 'A' | 'B' | 'C') => setQuizCorrectAnswer(value)}
                      >
                        <SelectTrigger id="quiz-correct-answer">
                          <SelectValue placeholder="Vyberte správnu odpoveď" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={handleCreateQuiz} className="w-full">
                      Vytvoriť kvíz
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="p-4 bg-muted/50 rounded-lg border border-border"
                >
                  {editingQuiz?.id === quiz.id ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Otázka</Label>
                        <Textarea
                          value={editQuizQuestion}
                          onChange={(e) => setEditQuizQuestion(e.target.value)}
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Odpoveď A</Label>
                        <Input
                          value={editQuizOptionA}
                          onChange={(e) => setEditQuizOptionA(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Odpoveď B</Label>
                        <Input
                          value={editQuizOptionB}
                          onChange={(e) => setEditQuizOptionB(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Odpoveď C</Label>
                        <Input
                          value={editQuizOptionC}
                          onChange={(e) => setEditQuizOptionC(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Správna odpoveď</Label>
                        <Select
                          value={editQuizCorrectAnswer}
                          onValueChange={(value: 'A' | 'B' | 'C') => setEditQuizCorrectAnswer(value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="C">C</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleSaveQuiz} size="sm">
                          <Save className="w-4 h-4 mr-1" />
                          Uložiť
                        </Button>
                        <Button onClick={handleCancelEditQuiz} variant="outline" size="sm">
                          <X className="w-4 h-4 mr-1" />
                          Zrušiť
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-4 h-4 text-primary" />
                          <span className={`text-xs px-2 py-0.5 rounded-full ${quiz.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {quiz.isActive ? 'Aktívny' : 'Neaktívny'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {quiz.points} bodov
                          </span>
                        </div>
                        <p className="font-medium mb-2">{quiz.question}</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${quiz.correctAnswer === 'A' ? 'text-green-600' : ''}`}>A:</span>
                            <span className={quiz.correctAnswer === 'A' ? 'text-green-600' : ''}>{quiz.optionA}</span>
                            {quiz.correctAnswer === 'A' && <span className="text-green-600">✓</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${quiz.correctAnswer === 'B' ? 'text-green-600' : ''}`}>B:</span>
                            <span className={quiz.correctAnswer === 'B' ? 'text-green-600' : ''}>{quiz.optionB}</span>
                            {quiz.correctAnswer === 'B' && <span className="text-green-600">✓</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${quiz.correctAnswer === 'C' ? 'text-green-600' : ''}`}>C:</span>
                            <span className={quiz.correctAnswer === 'C' ? 'text-green-600' : ''}>{quiz.optionC}</span>
                            {quiz.correctAnswer === 'C' && <span className="text-green-600">✓</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleQuizActive(quiz)}
                        >
                          <Switch checked={quiz.isActive} className="pointer-events-none" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditQuiz(quiz)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteQuiz(quiz.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {quizzes.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Žiadne kvízy zatiaľ. Vytvorte svoju prvú kvízovú otázku!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* School Mood Statistics - Detailed View */}
        {schoolMoodStats && schoolMoodStats.totalResponses > 0 && (
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50/30 to-pink-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smile className="w-5 h-5 text-purple-600" />
                Nálada študentov
              </CardTitle>
              <CardDescription>
                Štatistiky nálady celej školy z {schoolMoodStats.totalResponses} {schoolMoodStats.totalResponses === 1 ? 'odpovede' : schoolMoodStats.totalResponses < 5 ? 'odpovedí' : 'odpovedí'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Overall Mood */}
                <div className="bg-white/60 rounded-lg p-6 border border-purple-200">
                  <div className="text-center">
                    <div className="text-7xl mb-3">
                      {schoolMoodStats.avgMood >= 4.5 ? '😄' : 
                       schoolMoodStats.avgMood >= 3.5 ? '😊' : 
                       schoolMoodStats.avgMood >= 2.5 ? '😐' : 
                       schoolMoodStats.avgMood >= 1.5 ? '😕' : '😞'}
                    </div>
                    <div className="text-4xl font-bold text-purple-600 mb-2">
                      {schoolMoodStats.avgMood.toFixed(2)}/5
                    </div>
                    <div className="text-lg text-muted-foreground">
                      {schoolMoodStats.avgMood >= 4 ? 'Študenti sa cítia výborne!' : 
                       schoolMoodStats.avgMood >= 3 ? 'Študenti sú v pohode' : 
                       schoolMoodStats.avgMood >= 2 ? 'Študenti by mohli byť šťastnejší' : 'Študenti potrebujú podporu'}
                    </div>
                  </div>
                </div>

                {/* Mood Distribution */}
                <div className="bg-white/60 rounded-lg p-6 border border-purple-200">
                  <h3 className="font-semibold mb-4">Rozdelenie nálad</h3>
                  <div className="space-y-3">
                    {[
                      { emoji: '😄', count: schoolMoodStats.mood5Count, label: 'Výborne', color: 'from-blue-400 to-blue-600' },
                      { emoji: '😊', count: schoolMoodStats.mood4Count, label: 'Dobre', color: 'from-green-400 to-green-600' },
                      { emoji: '😐', count: schoolMoodStats.mood3Count, label: 'Okej', color: 'from-yellow-400 to-yellow-600' },
                      { emoji: '😕', count: schoolMoodStats.mood2Count, label: 'Zle', color: 'from-orange-400 to-orange-600' },
                      { emoji: '😞', count: schoolMoodStats.mood1Count, label: 'Veľmi zle', color: 'from-red-400 to-red-600' },
                    ].map((mood, index) => {
                      const percentage = schoolMoodStats.totalResponses > 0 
                        ? (mood.count / schoolMoodStats.totalResponses) * 100 
                        : 0;
                      return (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{mood.emoji}</span>
                              <span className="text-sm font-medium">{mood.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{mood.count}x</span>
                              <span className="text-sm font-bold text-purple-600">{percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${mood.color} transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-700">
                  💡 <strong>Tip:</strong> Ak vidíte nižšiu priemernú náladu, skúste s študentmi diskutovať o ich skúsenostiach s aktívnou mobilitou. Možno potrebujú lepšie podmienky alebo podporu!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Rebríček študentov</CardTitle>
            <CardDescription>Najlepší študenti</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.slice(0, 10).map((student, index) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{student.totalPoints} pts</div>
                    <div className="text-xs text-green-600 flex items-center gap-1 justify-end">
                      <TreePine className="w-3 h-3" />
                      {(student.totalCo2SavedG / 1000).toFixed(1)} kg CO₂
                      <span className="text-muted-foreground">
                        (~{Math.round((student.totalCo2SavedG / 1000 * 12) / 10)} stromov)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Žiadni študenti zatiaľ nezískali body
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
