import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>SafeOps Login</CardTitle>
          <CardDescription>Entre com suas credenciais para acessar o sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email">Email</label>
            <Input id="email" type="email" placeholder="nome@empresa.com" />
          </div>
          <div className="space-y-2">
            <label htmlFor="password">Senha</label>
            <Input id="password" type="password" />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Entrar</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
