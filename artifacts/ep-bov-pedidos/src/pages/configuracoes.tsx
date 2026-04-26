import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Image, Palette, Save } from "lucide-react";

export default function Configuracoes() {
  const { toast } = useToast();
  const [logo, setLogo] = useState<string | null>(null);
  
  useEffect(() => {
    const storedLogo = localStorage.getItem("epbov_logo");
    if (storedLogo) setLogo(storedLogo);
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogo(base64String);
        localStorage.setItem("epbov_logo", base64String);
        toast({ title: "Logo atualizada", description: "Recarregue a página para ver a alteração na barra lateral." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogo(null);
    localStorage.removeItem("epbov_logo");
    toast({ title: "Logo removida", description: "A logo padrão será exibida." });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie as preferências do sistema.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              Identidade Visual
            </CardTitle>
            <CardDescription>Personalize a logo da empresa exibida nos relatórios e barra lateral.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center bg-muted/20">
                {logo ? (
                  <div className="space-y-4 w-full flex flex-col items-center">
                    <img src={logo} alt="Logo preview" className="max-h-32 object-contain" />
                    <Button variant="destructive" size="sm" onClick={handleRemoveLogo}>Remover Logo</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-primary/10 p-3 rounded-full inline-block">
                      <Image className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-sm text-muted-foreground">Nenhuma logo configurada</div>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="logo-upload">Fazer upload de nova logo</Label>
                <Input 
                  id="logo-upload" 
                  type="file" 
                  accept="image/*" 
                  className="mt-1"
                  onChange={handleLogoUpload}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Cores do Sistema
            </CardTitle>
            <CardDescription>O sistema utiliza uma paleta de cores rural em tons de verde pastel.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary shadow-sm border" />
                <div>
                  <div className="font-medium">Verde Pastel (Primária)</div>
                  <div className="text-sm text-muted-foreground">Cor principal da identidade.</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground border-t pt-4">
                A paleta de cores é pré-configurada para manter a consistência visual focada no agronegócio e está definida globalmente.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader>
            <CardTitle>Cadastro de Usuários</CardTitle>
            <CardDescription>Gerencie quem tem acesso ao sistema (Em breve)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled>Gerenciar Usuários</Button>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader>
            <CardTitle>Trocar Senha</CardTitle>
            <CardDescription>Altere a sua senha de acesso (Em breve)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled>Mudar Senha</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
