import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf } from "lucide-react";
import { useLocation } from "wouter";

export default function Login() {
  const { login, isLoggedIn } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (isLoggedIn) {
    setLocation("/dashboard");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      login();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-primary">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Leaf className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">EP BOV Pedidos</h1>
          <p className="text-muted-foreground mt-2">Sistema de Gestão de Vendas</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Acesso ao Sistema</CardTitle>
            <CardDescription>Insira suas credenciais para entrar</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail ou Usuário</Label>
                <Input 
                  id="email" 
                  type="text" 
                  placeholder="vendedor@epbov.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <a href="#" className="text-xs text-primary hover:underline" onClick={(e) => e.preventDefault()}>
                    Esqueceu a senha?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" size="lg">
                Entrar no Sistema
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
