import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-6 sm:p-12">
      <div className="w-full max-w-2xl flex justify-center">
        <Card className="w-full max-w-md shadow-xl border-0 ring-0 bg-white">
          <CardHeader className="space-y-4 text-center p-8 pb-6">
            <div className="flex justify-center">
              <div className="bg-primary/10 p-4 rounded-full">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
            </div>
            <div>
              <CardTitle className="text-3xl font-bold tracking-tight">SafeOps</CardTitle>
              <CardDescription className="text-base mt-2">
                Autentique-se para gerenciar ocorrências
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-8 py-2">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold leading-none text-slate-700">
                E-mail
              </label>
              <Input id="email" type="email" placeholder="nome@empresa.com" className="h-12 text-base" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold leading-none text-slate-700">
                  Senha
                </label>
                <a href="#" className="text-xs text-primary font-medium hover:underline">
                  Esqueceu a senha?
                </a>
              </div>
              <Input id="password" type="password" className="h-12 text-base" />
            </div>
          </CardContent>
          <CardFooter className="p-8 pt-6">
            <Button className="w-full h-12 text-base font-bold shadow-md">Entrar no sistema</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
