import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(email, password);
    
    if (success) {
      toast({
        title: "Login realizado com sucesso!",
        description: "Você será redirecionado para o dashboard.",
      });
      navigate('/dashboard');
    } else {
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: "Email ou senha incorretos.",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sea-light via-background to-sea-light flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-30 bg-repeat" 
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231E88E5' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
           }}>
      </div>
      
      <Card className="w-full max-w-md relative z-10 android-card border-sea/20">
        <CardHeader className="text-center">
          <div className="mb-4">
            <Link 
              to="/" 
              className="text-sm text-muted-foreground hover:text-sea underline-offset-4 hover:underline android-touch inline-block p-2"
            >
              ← Voltar ao início
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-sea-dark">Entrar</CardTitle>
          <CardDescription>
            Acesse sua conta para gerenciar suas reservas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-base">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="android-input border-sea/30 focus:border-sea"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="password" className="text-base">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="android-input border-sea/30 focus:border-sea"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-sea hover:bg-sea-dark text-white android-touch"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-base text-muted-foreground leading-relaxed">
              Não tem uma conta?{' '}
              <Link 
                to="/register" 
                className="text-sea hover:text-sea-dark font-medium underline-offset-4 hover:underline android-touch inline-block p-1"
              >
                Cadastre-se
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;