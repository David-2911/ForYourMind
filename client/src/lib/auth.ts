import { User, AuthResponse } from "../types";

const API_BASE = "/api";

class AuthService {
  public token: string | null = null;
  public user: User | null = null;

  constructor() {
    this.token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("auth_user");
    this.user = userData ? JSON.parse(userData) : null;
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  hasRole(role: string): boolean {
    return this.user?.role === role;
  }

  async login(email: string, password: string, organizationCode?: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      credentials: 'include',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, organizationCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const data: AuthResponse = await response.json();
    this.setAuthData(data);
    return data;
  }

  async refresh(): Promise<AuthResponse | null> {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) return null;
      const data: AuthResponse = await response.json();
      this.setAuthData(data);
      return data;
    } catch (e) {
      return null;
    }
  }

  async register(userData: {
    email: string;
    password: string;
    displayName: string;
    role: "individual" | "manager" | "admin";
  }): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      credentials: 'include',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    const data: AuthResponse = await response.json();
    this.setAuthData(data);
    return data;
  }

  logout(): void {
    // inform server to clear refresh cookie, then clear local state and navigate home
    fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' })
      .catch(() => {})
      .finally(() => {
        this.token = null;
        this.user = null;
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        try { window.location.href = '/'; } catch (e) { /* ignore in non-browser env */ }
      });
  }

  private setAuthData(data: AuthResponse): void {
    this.token = data.token;
    this.user = data.user;
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
  }

  getAuthHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };
  }
}

export const authService = new AuthService();

export const useAuth = () => {
  return {
    user: authService.getUser(),
    isAuthenticated: authService.isAuthenticated(),
    hasRole: authService.hasRole.bind(authService),
    login: authService.login.bind(authService),
    register: authService.register.bind(authService),
    logout: authService.logout.bind(authService),
    refreshAuth: () => {
      // Force a re-read of auth data from localStorage
      const token = localStorage.getItem("auth_token");
      const userData = localStorage.getItem("auth_user");
      authService.token = token;
      authService.user = userData ? JSON.parse(userData) : null;
    }
  };
};
