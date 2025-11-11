import { User, AuthResponse } from "../types";

// Use the environment variable if available, otherwise fall back to empty string
// Note: All endpoints will include /api prefix, so this should be just the base URL
const API_BASE = import.meta.env.VITE_API_URL || "";

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
    const hasToken = !!this.token;
    const hasUser = !!this.user;
    
    // If we have inconsistent state, clear everything and return false
    if (hasToken !== hasUser) {
      this.token = null;
      this.user = null;
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      return false;
    }
    
    return hasToken && hasUser;
  }

  hasRole(role: string): boolean {
    return this.user?.role === role;
  }

  async login(email: string, password: string, organizationCode?: string): Promise<AuthResponse> {
    try {
      console.log(`Attempting login to ${API_BASE}/api/auth/login`);
      
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, organizationCode }),
      });

      if (!response.ok) {
        console.error(`Login failed with status ${response.status}`);
        
        // Read response as text first, then try to parse as JSON
        const text = await response.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || "Login failed");
        } catch (parseError) {
          // If we can't parse as JSON, use the text
          console.error("Response is not valid JSON:", text.substring(0, 100));
          throw new Error(`Login failed: Server returned invalid response (${response.status})`);
        }
      }

      const data: AuthResponse = await response.json();
      this.setAuthData(data);
      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async refresh(): Promise<AuthResponse | null> {
    try {
      console.log("Attempting token refresh");
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        console.warn("Token refresh failed:", response.status);
        return null;
      }
      
      const data: AuthResponse = await response.json();
      this.setAuthData(data);
      console.log("Token refresh successful");
      return data;
    } catch (e) {
      console.error("Token refresh error:", e);
      return null;
    }
  }

  async register(userData: {
    email: string;
    password: string;
    displayName: string;
    role: "individual" | "manager" | "admin";
  }): Promise<AuthResponse> {
    try {
      console.log(`Attempting registration to ${API_BASE}/api/auth/register`);
      
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        console.error(`Registration failed with status ${response.status}`);
        
        // Read response as text first, then try to parse as JSON
        const text = await response.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || "Registration failed");
        } catch (parseError) {
          // If we can't parse as JSON, use the text
          console.error("Response is not valid JSON:", text.substring(0, 100));
          throw new Error(`Registration failed: Server returned invalid response (${response.status})`);
        }
      }

      const data: AuthResponse = await response.json();
      this.setAuthData(data);
      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  logout(): void {
    // inform server to clear refresh cookie, then clear local state and navigate home
    fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' })
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
    if (!data || !data.token || !data.user) {
      console.error("Invalid auth data received:", data);
      return;
    }
    
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
