import { useState, useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DemoBanner() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const dismissed = sessionStorage.getItem("listapro-demo-dismissed");
      if (!dismissed) {
        setIsVisible(true);
      }
    }
  }, [isAuthenticated, isLoading]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("listapro-demo-dismissed", "true");
  };

  const handleLogin = () => {
    const base = import.meta.env.BASE_URL.replace(/\/+$/, "") || "/";
    window.location.href = `/api/login?returnTo=${encodeURIComponent(base)}`;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-white text-black py-2 px-4 relative z-[60] overflow-hidden"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium uppercase tracking-widest">
              <span className="w-2 h-2 bg-black rounded-full animate-pulse" />
              Modo Demo activo — inicia sesión para guardar tus listados
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogin}
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-tighter hover:underline"
              >
                Iniciar Sesión <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-black/10 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
