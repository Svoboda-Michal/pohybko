import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabaseAuth } from '@/lib/supabaseAuth';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', role: 'student' as 'student' | 'admin' });

  // Handle OAuth callback when user returns from Google
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check if this is an OAuth callback (URL will have #access_token=...)
      if (window.location.hash.includes('access_token')) {
        setIsGoogleLoading(true);
        
        const { user, error } = await supabaseAuth.handleOAuthCallback();
        
        if (error) {
          toast({
            title: 'Prihlásenie neúspešné',
            description: error,
            variant: 'destructive',
          });
        } else if (user) {
          toast({
            title: 'Vitajte!',
            description: `Prihlásený/á ako ${user.name}`,
          });
          navigate(user.role === 'admin' ? '/admin' : '/dashboard');
        }
        
        setIsGoogleLoading(false);
      }
    };

    handleOAuthCallback();
  }, [navigate, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { user, error } = await supabaseAuth.login(loginData.email, loginData.password);

    if (error) {
      toast({
        title: 'Prihlásenie neúspešné',
        description: error,
        variant: 'destructive',
      });
    } else if (user) {
      toast({
        title: 'Vitajte späť!',
        description: `Logged in as ${user.name}`,
      });
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    }

    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { user, error } = await supabaseAuth.signup(
      signupData.name,
      signupData.email,
      signupData.password,
      signupData.role
    );

    if (error) {
      toast({
        title: 'Registrácia neúspešná',
        description: error,
        variant: 'destructive',
      });
    } else if (user) {
      toast({
        title: 'Účet vytvorený!',
        description: 'Vitajte v Pohybko',
      });
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    }

    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const { error } = await supabaseAuth.signInWithGoogle();
    
    if (error) {
      toast({
        title: 'Google prihlásenie neúspešné',
        description: error,
        variant: 'destructive',
      });
      setIsGoogleLoading(false);
    }
    // If successful, user will be redirected to Google, then back here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <img src="/pohybko-logo.png" alt="Pohybko" className="h-24" />
          </div>
          <p className="text-muted-foreground">Urobte si cestu do školy hrou</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vitajte</CardTitle>
            <CardDescription>Prihláste sa alebo vytvorte účet na začatie zbierania bodov</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Prihlásenie</TabsTrigger>
                <TabsTrigger value="signup">Registrácia</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-mail</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="vas@email.sk"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Heslo</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                    {isLoading ? 'Prihlasujem sa...' : 'Prihlásenie'}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Alebo</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleGoogleLogin}
                    variant="outline"
                    className="w-full"
                    disabled={isLoading || isGoogleLoading}
                  >
                    {isGoogleLoading ? (
                      'Pripájam...'
                    ) : (
                      <>
                        <img
                          src="https://www.svgrepo.com/show/355037/google.svg"
                          alt="Google"
                          className="w-5 h-5 mr-2"
                        />
                        Prihlásenie cez Google
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Celé meno</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Vaše meno"
                      value={signupData.name}
                      onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-mail</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="vas@email.sk"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Heslo</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-role">Som</Label>
                    <select
                      id="signup-role"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      value={signupData.role}
                      onChange={(e) => setSignupData({ ...signupData, role: e.target.value as 'student' | 'admin' })}
                    >
                      <option value="student">Študent</option>
                      <option value="admin">Školský administrátor</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                    {isLoading ? 'Vytváram účet...' : 'Registrácia'}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Alebo</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleGoogleLogin}
                    variant="outline"
                    className="w-full"
                    disabled={isLoading || isGoogleLoading}
                  >
                    {isGoogleLoading ? (
                      'Pripájam...'
                    ) : (
                      <>
                        <img
                          src="https://www.svgrepo.com/show/355037/google.svg"
                          alt="Google"
                          className="w-5 h-5 mr-2"
                        />
                        Registrácia cez Google
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
