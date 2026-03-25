import { Link, useLocation } from "wouter";
import { Menu, Plus, LayoutDashboard, Sun, Moon, Settings, LogOut, LogIn } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogin = () => {
    login();
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-transparent ${
          scrolled || (location !== "/" && location !== "")
            ? "bg-background/90 backdrop-blur-md border-white/10 py-4"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="group flex items-center gap-3">
            <div className="w-8 h-8 rounded-none border border-foreground flex items-center justify-center transition-transform duration-500">
              <span className="font-sans font-bold text-foreground text-sm">VX</span>
            </div>
            <span className="font-sans text-xl font-bold tracking-widest text-foreground group-hover:text-muted-foreground transition-colors">
              VENDRIXA
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="/listados" 
              className={`text-sm font-medium uppercase tracking-widest transition-colors ${
                location === "/listados" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Listados
            </Link>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Alternar tema"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 outline-none group">
                      <Avatar className="w-8 h-8 rounded-none border border-white/10">
                        <AvatarImage src={user?.profileImageUrl ?? undefined} />
                        <AvatarFallback className="rounded-none bg-white/5 text-xs font-bold">
                          {user?.firstName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors hidden lg:block">
                        {user?.firstName} {user?.lastName}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#111] border-white/10 text-white rounded-none min-w-[200px]" align="end">
                    <DropdownMenuLabel className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Mi Cuenta</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <Link href="/configuracion">
                      <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-white focus:text-black rounded-none uppercase tracking-widest text-[11px] font-bold py-3">
                        <Settings className="w-4 h-4" />
                        Configuración
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="flex items-center gap-2 cursor-pointer focus:bg-destructive focus:text-white rounded-none uppercase tracking-widest text-[11px] font-bold py-3"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={handleLogin}
                  className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Ingresar
                </button>
              )}

              <Link 
                href="/nuevo-listado" 
                className="group relative px-6 py-2.5 bg-foreground text-background text-sm font-bold uppercase tracking-widest overflow-hidden transition-all hover:opacity-90"
              >
                <span className="relative flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Crear Listado
                </span>
              </Link>
            </div>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-foreground p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-24 px-6 pb-6 flex flex-col gap-6 md:hidden"
          >
            <Link 
              href="/listados" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 text-lg font-medium text-foreground p-4 border border-white/5 rounded-none bg-card/50"
            >
              <LayoutDashboard className="w-5 h-5" />
              Listados
            </Link>
            <Link 
              href="/configuracion" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 text-lg font-medium text-foreground p-4 border border-white/5 rounded-none bg-card/50"
            >
              <Settings className="w-5 h-5" />
              Configuración
            </Link>
            <div className="flex items-center justify-between p-4 border border-white/5 bg-card/50">
              <span className="text-lg font-medium text-foreground">Tema</span>
              <button
                onClick={toggleTheme}
                className="p-2 bg-white/5 border border-white/10"
              >
                {theme === "dark" ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-black" />}
              </button>
            </div>
            {isAuthenticated ? (
              <button 
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 text-lg font-medium text-destructive p-4 border border-destructive/20 rounded-none bg-destructive/5 mt-auto"
              >
                <LogOut className="w-5 h-5" />
                Cerrar Sesión
              </button>
            ) : (
              <button 
                onClick={() => { handleLogin(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 text-lg font-medium text-black p-4 rounded-none bg-white mt-auto"
              >
                <LogIn className="w-5 h-5" />
                Iniciar Sesión
              </button>
            )}
            <Link 
              href="/nuevo-listado" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 text-lg font-medium text-black p-4 rounded-none bg-white"
            >
              <Plus className="w-5 h-5" />
              Crear Nuevo Listado
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
