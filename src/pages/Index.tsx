import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Award, Users, MapPin } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <img src="/pohybko-logo.png" alt="Pohybko" className="h-12" />
          <Button onClick={() => navigate('/login')}>Začať</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 space-y-20">
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <img src="/pohybko-logo.png" alt="Pohybko" className="h-32" />
          </div>
          <h1 className="text-5xl font-bold text-foreground">
            Urobte si cestu do školy dobrodružstvom
          </h1>
          <p className="text-xl text-muted-foreground">
            Získajte body chôdzou, cyklistikou alebo používaním verejnej dopravy. Súťažte so spolužiakmi a urobte aktívnu mobilitu zábavnou!
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate('/login')}>
              Začať svoje dobrodružstvo
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
              Admin prihlásenie
            </Button>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="border-primary/20">
            <CardHeader>
              <MapPin className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Skenuj a zarábaj</CardTitle>
              <CardDescription>
                Skenujte QR kódy na školských bránach, chodníkoch a autobusových zastávkach na získanie bodov
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-secondary/20">
            <CardHeader>
              <Award className="w-10 h-10 text-secondary mb-2" />
              <CardTitle>Vystúpaj v rebríčku</CardTitle>
              <CardDescription>
                Súťažte so spolužiakmi v rebríčku a staňte sa najlepším aktívnym cestujúcim
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-accent/20">
            <CardHeader>
              <Users className="w-10 h-10 text-accent mb-2" />
              <CardTitle>Vytvorte si návyky</CardTitle>
              <CardDescription>
                Urobte aktívnu dopravu denným návykom počas zábavy a udržiavania zdravia
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="bg-card border border-border rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Pre školy</h2>
            <p className="text-lg text-muted-foreground">
              Spravujte program aktívnej mobility vašej školy pomocou nášho admin panelu
            </p>
            <ul className="text-left max-w-md mx-auto space-y-2 py-4">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>Vytvorte a spravujte QR kodové stanice</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>Sledujte účasť a zapojenie študentov</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>Zobrazte analýzy a rebríčky</span>
              </li>
            </ul>
            <Button size="lg" onClick={() => navigate('/login')}>
              Admin prístup
            </Button>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 py-8 border-t border-border mt-20">
        <div className="text-center text-sm text-muted-foreground">
          <p>Pohybko - Podpora udržateľnej dopravy v Bratislave</p>
          <p className="mt-2">Dôkaz konceptu • Demo verzia</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
