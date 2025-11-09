import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { authService } from "./auth";

// Build full API URL from a path. Allows deploying frontend and backend separately.
const RAW_API_BASE = (import.meta as any)?.env?.VITE_API_BASE_URL || (import.meta as any)?.env?.VITE_API_URL || "";
const API_BASE = typeof RAW_API_BASE === 'string' ? RAW_API_BASE.replace(/\/$/, '') : "";

function buildUrl(path: string): string {
  // path should start with '/'
  if (!API_BASE) return path;
  if (/^https?:/i.test(path)) return path; // already absolute
  // Avoid double '/api' if API_BASE already ends with '/api' and path starts with '/api'
  if (API_BASE.endsWith('/api') && path.startsWith('/api')) {
    return API_BASE + path.replace(/^\/api/, '');
  }
  return API_BASE + path;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  const token = authService.getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(buildUrl(url), {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // If unauthorized, attempt to refresh once and retry
  if (res.status === 401) {
    try {
      const refreshed = await authService.refresh();
      if (refreshed) {
  const token = authService.getToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
  const retried = await fetch(buildUrl(url), { method, headers, body: data ? JSON.stringify(data) : undefined, credentials: "include" });
        await throwIfResNotOk(retried);
        const text2 = await retried.text();
        try { return JSON.parse(text2) as any; } catch (e) { return text2 as any; }
      }
    } catch (e) {
      // continue to throw original error below
    }
  }

  await throwIfResNotOk(res);
  // return parsed JSON for convenience
  const text = await res.text();
  try {
    return JSON.parse(text) as any;
  } catch (e) {
    return text as any;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
  const url = buildUrl(queryKey.join("/") as string);

  const token = authService.getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res = await fetch(url, { credentials: "include", headers });

    // Try to refresh session once if unauthorized
    if (res.status === 401) {
      try {
        const refreshed = await authService.refresh();
        if (refreshed) {
          // retry original request with new token header
          const newHeaders = { ...headers };
          const newToken = authService.getToken();
          if (newToken) newHeaders["Authorization"] = `Bearer ${newToken}`;
          res = await fetch(url, { credentials: 'include', headers: newHeaders });
        }
      } catch (e) {
        // ignore and let error flow below
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
