import { Link, useLocation } from "wouter";
import { Menu, Sun, Moon, Settings, LogOut, LogIn, X, Home, Building2, PlusSquare, SlidersHorizontal } from "lucide-react";
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

const NAV_LINKS = [
  { href: "/",              label: "Inicio" },
  { href: "/listados",      label: "Propiedades" },
  { href: "/nuevo-listado", label: "Nueva" },
  { href: "/configuracion", label: "Configuración" },
];

const MOBILE_LINKS = [
  { href: "/",              label: "Inicio",          Icon: Home },
  { href: "/listados",      label: "Propiedades",     Icon: Building2 },
  { href: "/nuevo-listado", label: "Nueva Propiedad", Icon: PlusSquare },
  { href: "/configuracion", label: "Configuración",   Icon: SlidersHorizontal },
];

export default function Navbar() {
  const [location] = useLocation();
  const [scrolled, setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isLanding  = location === "/" || location === "";
  const transparent = isLanding && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          transparent
            ? "bg-transparent py-5"
            : "bg-background/92 backdrop-blur-lg border-b border-border/60 py-3 shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className={`w-8 h-8 flex items-center justify-center border-2 transition-all duration-300 ${
              transparent
                ? "border-white/50 group-hover:bg-white/15 group-hover:border-white"
                : "border-primary/50 group-hover:bg-primary group-hover:border-primary"
            }`}>
              <span className={`font-bold text-xs tracking-widest transition-colors duration-300 ${
                transparent
                  ? "text-white"
                  : "text-primary group-hover:text-primary-foreground"
              }`}>VX</span>
            </div>
            <span className={`font-bold tracking-widest text-sm uppercase transition-colors duration-300 ${
              transparent ? "text-white" : "text-foreground"
            }`}>
              VENDRIXA
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium tracking-wide transition-colors duration-200 relative group ${
                  location === href
                    ? transparent ? "text-white" : "text-foreground font-semibold"
                    : transparent ? "text-white/60 hover:text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                {location === href && (
                  <span className={`absolute -bottom-1 left-0 right-0 h-px ${
                    transparent ? "bg-white/60" : "bg-primary"
                  }`} />
                )}
              </Link>
            ))}
          </nav>

          {/* Right: theme + auth */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2 transition-colors duration-200 ${
                transparent ? "text-white/65 hover:text-white" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Alternar tema"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 outline-none">
                    <Avatar className="w-7 h-7 rounded-none border border-primary/40">
                      <AvatarImage src={user?.profileImageUrl ?? undefined} />
                      <AvatarFallback className="rounded-none bg-muted text-[10px] font-bold text-primary">
                        {user?.firstName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className={`text-xs font-medium hidden lg:block transition-colors ${
                      transparent ? "text-white/70" : "text-muted-foreground"
                    }`}>{user?.firstName}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-card border-border rounded-none min-w-[180px] shadow-xl" align="end">
                  <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Mi Cuenta
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <Link href="/configuracion">
                    <DropdownMenuItem className="flex items-center gap-2 cursor-pointer rounded-none text-xs font-medium py-2.5 uppercase tracking-wider">
                      <Settings className="w-3.5 h-3.5" />
                      Configuración
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem
                    onClick={logout}
                    className="flex items-center gap-2 cursor-pointer rounded-none text-xs font-medium py-2.5 uppercase tracking-wider text-destructive focus:bg-destructive focus:text-white"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={login}
                className={`text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5 px-4 py-2 border transition-all duration-200 ${
                  transparent
                    ? "border-white/35 text-white hover:bg-white/12"
                    : "border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Ingresar
              </button>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className={`md:hidden p-2 transition-colors ${transparent ? "text-white" : "text-foreground"}`}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-40 bg-background/98 backdrop-blur-xl pt-20 px-6 pb-8 flex flex-col md:hidden"
          >
            <nav className="flex flex-col gap-0.5 mt-2">
              {MOBILE_LINKS.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-4 py-4 border-b border-border text-base font-medium transition-colors ${
                    location === href ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mt-8 flex flex-col gap-3">
              <div className="flex items-center justify-between py-3.5 border border-border px-4">
                <span className="text-sm font-medium text-foreground">
                  Tema {theme === "dark" ? "Oscuro" : "Claro"}
                </span>
                <button onClick={toggleTheme} className="p-1.5 bg-muted">
                  {theme === "dark"
                    ? <Sun className="w-4 h-4 text-primary" />
                    : <Moon className="w-4 h-4 text-foreground" />}
                </button>
              </div>

              {isAuthenticated ? (
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="flex items-center gap-3 py-3.5 px-4 border border-destructive/30 text-destructive text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              ) : (
                <button
                  onClick={() => { login(); setMobileOpen(false); }}
                  className="flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground text-sm font-bold uppercase tracking-widest"
                >
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
