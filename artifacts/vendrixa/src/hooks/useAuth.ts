import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { AuthUser } from "@/types";

const AUTH_QUERY_KEY = ["auth", "user"] as const;

interface AuthResponse {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: () => apiClient.get<AuthResponse>("/auth/user"),
    retry: false,
    staleTime: 0,               // siempre consulta el backend al montar
    refetchOnWindowFocus: true, // revalida cuando el usuario vuelve a la pestaña
  });

  const login = () => {
    window.location.href = "/login";
  };

  const logout = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    queryClient.setQueryData(AUTH_QUERY_KEY, {
      user: null,
      isAuthenticated: false,
    });
    window.location.href = "/";
  };

  return {
    user: data?.user ?? null,
    isAuthenticated: data?.isAuthenticated ?? false,
    isLoading,
    login,
    logout,
  };
}
