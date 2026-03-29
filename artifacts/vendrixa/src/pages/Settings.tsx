import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  User, 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  ArrowLeft,
  ChevronRight,
  Shield,
  Palette,
  Bell
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/listados">
            <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground hover:text-white pl-0">
              <ArrowLeft className="w-4 h-4" />
              Volver a Listados
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight uppercase">Configuración</h1>
        </div>

        <div className="grid gap-8">
          {/* Profile Section */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground mb-4">Perfil</h2>
            <Card className="bg-[#111] border-white/10 rounded-none overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <Avatar className="w-20 h-20 rounded-none border border-white/10">
                    <AvatarImage src={user?.profileImageUrl ?? undefined} />
                    <AvatarFallback className="rounded-none bg-white/5 text-xl font-bold">
                      {user?.firstName?.charAt(0) || "D"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center sm:text-left">
                    <h3 className="text-xl font-bold">{user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Usuario Demo"}</h3>
                    <p className="text-muted-foreground">{user?.email || "modo-demo@vendrixa.com"}</p>
                    {!isAuthenticated && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Sesión no iniciada
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Preferences Section */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground mb-4">Preferencias</h2>
            <Card className="bg-[#111] border-white/10 rounded-none">
              <CardContent className="p-0">
                <div className="p-6 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10">
                      {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm uppercase tracking-widest">Modo Oscuro</p>
                      <p className="text-xs text-muted-foreground">Cambiar entre tema claro y oscuro</p>
                    </div>
                  </div>
                  <Switch 
                    checked={theme === "dark"} 
                    onCheckedChange={toggleTheme}
                  />
                </div>
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm uppercase tracking-widest">Notificaciones</p>
                      <p className="text-xs text-muted-foreground">Gestionar alertas de nuevos leads</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Branding Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Marca Personal</h2>
              <span className="px-1.5 py-0.5 bg-white text-black text-[9px] font-black uppercase tracking-tighter">Pro</span>
            </div>
            <Card className="bg-[#111] border-white/10 rounded-none">
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase tracking-widest">Nombre del Agente</Label>
                  <Input 
                    placeholder="Ej. Juan Pérez" 
                    className="bg-white/5 border-white/10 rounded-none focus-visible:ring-white/20"
                    disabled
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase tracking-widest">Logo (URL)</Label>
                  <Input 
                    placeholder="https://tu-logo.com/img.png" 
                    className="bg-white/5 border-white/10 rounded-none focus-visible:ring-white/20"
                    disabled
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase tracking-widest">Color de Acento</Label>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-white border border-white/10" title="Blanco (Default)" />
                    <div className="w-10 h-10 bg-blue-500 border border-white/10 opacity-50" />
                    <div className="w-10 h-10 bg-emerald-500 border border-white/10 opacity-50" />
                    <div className="w-10 h-10 bg-amber-500 border border-white/10 opacity-50" />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic mt-1">
                    * Personalización de marca disponible en el plan Platinum.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
