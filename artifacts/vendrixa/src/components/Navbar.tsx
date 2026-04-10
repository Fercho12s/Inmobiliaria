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
  const [location]    = useLocation();
  const [scrollY,    setScrollY]    = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isLanding   = location === "/" || location === "";
  const scrolled    = scrollY > 48;
  const transparent = isLanding && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Derived opacity for blur transition (0 → 1 over first 80px on landing)
  const blurProgress = isLanding ? Math.min(scrollY / 80, 1) : 1;

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-[padding] duration-400"
        style={{
          paddingTop:    transparent ? "1.25rem" : "0.75rem",
          paddingBottom: transparent ? "1.25rem" : "0.75rem",
          background:    `hsl(220 52% 8% / ${blurProgress * 0.94})`,
          backdropFilter: `blur(${blurProgress * 20}px)`,
          borderBottom:   `1px solid rgba(255,255,255,${blurProgress * 0.06})`,
          boxShadow:      scrolled ? `0 4px 24px rgba(0,0,0,${blurProgress * 0.4})` : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="w-8 h-8 flex items-center justify-center border transition-all duration-300"
              style={{
                borderColor: transparent
                  ? "rgba(255,255,255,0.3)"
                  : "hsl(42 62% 48% / 0.5)",
              }}
            >
              <span
                className="font-bold text-xs tracking-widest transition-colors duration-300"
                style={{ color: transparent ? "rgba(255,255,255,0.9)" : "hsl(42,62%,48%)" }}
              >
                VX
              </span>
            </div>
            <span
              className="font-bold tracking-[0.18em] text-sm uppercase transition-colors duration-300"
              style={{ color: transparent ? "rgba(255,255,255,0.9)" : "hsl(38,40%,88%)" }}
            >
              VENDRIXA
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(({ href, label }) => {
              const active = location === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="relative text-sm font-medium tracking-wide transition-colors duration-200 group"
                  style={{
                    color: active
                      ? transparent ? "rgba(255,255,255,1)" : "hsl(38,40%,90%)"
                      : transparent ? "rgba(255,255,255,0.55)" : "hsl(220,18%,52%)",
                  }}
                >
                  {label}
                  {active && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-px"
                      style={{
                        background: transparent
                          ? "rgba(255,255,255,0.5)"
                          : "hsl(42,62%,48%)",
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right controls */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 transition-colors duration-200 rounded-none"
              style={{ color: transparent ? "rgba(255,255,255,0.5)" : "hsl(220,18%,52%)" }}
              aria-label="Alternar tema"
            >
              {theme === "dark"
                ? <Sun className="w-4 h-4" />
                : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 outline-none">
                    <Avatar className="w-7 h-7 rounded-none border border-primary/35">
                      <AvatarImage src={user?.profileImageUrl ?? undefined} />
                      <AvatarFallback className="rounded-none bg-muted text-[10px] font-bold text-primary">
                        {user?.firstName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className="text-xs font-medium hidden lg:block transition-colors"
                      style={{ color: transparent ? "rgba(255,255,255,0.65)" : "hsl(220,18%,52%)" }}
                    >
                      {user?.firstName}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-card border-border rounded-none min-w-[180px] shadow-xl"
                  align="end"
                >
                  <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
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
                className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 px-4 py-2 border transition-all duration-200"
                style={{
                  borderColor:  transparent ? "rgba(255,255,255,0.25)" : "hsl(42 62% 48% / 0.4)",
                  color:        transparent ? "rgba(255,255,255,0.85)" : "hsl(42,62%,48%)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = transparent
                    ? "rgba(255,255,255,0.08)"
                    : "hsl(42 62% 48% / 0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <LogIn className="w-3.5 h-3.5" />
                Ingresar
              </button>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 transition-colors"
            style={{ color: transparent ? "rgba(255,255,255,0.8)" : "hsl(38,40%,88%)" }}
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
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background/98 backdrop-blur-2xl pt-20 px-6 pb-8 flex flex-col md:hidden"
          >
            <nav className="flex flex-col gap-0 mt-2">
              {MOBILE_LINKS.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-4 py-4 border-b border-white/6 text-sm font-medium transition-colors"
                  style={{ color: location === href ? "hsl(42,62%,48%)" : "hsl(220,18%,52%)" }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mt-8 flex flex-col gap-3">
              <div className="flex items-center justify-between py-3.5 border border-white/8 px-4">
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
                  className="flex items-center gap-3 py-3.5 px-4 border border-destructive/25 text-destructive text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              ) : (
                <button
                  onClick={() => { login(); setMobileOpen(false); }}
                  className="flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-[0.15em]"
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
