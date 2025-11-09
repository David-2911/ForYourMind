/**
 * API Client for making authenticated requests to backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  // Handle unauthorized - could trigger logout
  if (response.status === 401) {
    // Token expired or invalid
    console.warn('Unauthorized request, user may need to re-login');
  }
  
  return response;
}

export default apiRequest;
