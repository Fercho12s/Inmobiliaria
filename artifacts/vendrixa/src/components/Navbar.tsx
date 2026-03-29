import { Link, useLocation } from "wouter";
import { Menu, Plus, Sun, Moon, Settings, LogOut, LogIn, X, Home, Building2, Users, Info } from "lucide-react";
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
  { href: "/", label: "Inicio" },
  { href: "/listados", label: "Propiedades" },
  { href: "/nuevo-listado", label: "Agentes" },
  { href: "/configuracion", label: "Nosotros" },
];

export default function Navbar() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border py-3"
            : "bg-background py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 border-2 border-foreground flex items-center justify-center group-hover:bg-foreground transition-colors duration-200">
              <span className="font-bold text-foreground group-hover:text-background text-xs tracking-widest transition-colors duration-200">
                VX
              </span>
            </div>
            <span className="font-bold text-foreground tracking-widest text-sm uppercase">
              VENDRIXA
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors ${
                  location === href
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-none text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Alternar tema"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Auth */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 outline-none">
                    <Avatar className="w-7 h-7 rounded-none border border-border">
                      <AvatarImage src={user?.profileImageUrl ?? undefined} />
                      <AvatarFallback className="rounded-none bg-muted text-[10px] font-bold">
                        {user?.firstName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-muted-foreground hidden lg:block">
                      {user?.firstName}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-card border-border rounded-none min-w-[180px] shadow-lg"
                  align="end"
                >
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
                className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Ingresar
              </button>
            )}

            {/* CTA */}
            <Link
              href="/nuevo-listado"
              className="px-5 py-2.5 border border-foreground text-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Crear Listado
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menú"
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
            className="fixed inset-0 z-40 bg-background pt-20 px-6 pb-8 flex flex-col md:hidden"
          >
            <nav className="flex flex-col gap-1 mt-4">
              {[
                { href: "/", label: "Inicio", Icon: Home },
                { href: "/listados", label: "Propiedades", Icon: Building2 },
                { href: "/nuevo-listado", label: "Agentes", Icon: Users },
                { href: "/configuracion", label: "Nosotros", Icon: Info },
              ].map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-4 py-4 border-b border-border text-base font-medium transition-colors ${
                    location === href ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mt-8 flex flex-col gap-3">
              <div className="flex items-center justify-between py-3 border border-border px-4">
                <span className="text-sm font-medium text-foreground">Tema {theme === "dark" ? "Oscuro" : "Claro"}</span>
                <button onClick={toggleTheme} className="p-1.5 bg-muted">
                  {theme === "dark"
                    ? <Sun className="w-4 h-4 text-foreground" />
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
                  className="flex items-center gap-3 py-3.5 px-4 border border-border text-foreground text-sm font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
                </button>
              )}

              <Link
                href="/nuevo-listado"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 py-3.5 bg-foreground text-background text-sm font-bold uppercase tracking-widest"
              >
                <Plus className="w-4 h-4" />
                Crear Nuevo Listado
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
