// API utility for EXPREZZZO Sovereign House
// Handles both local development and Vercel production deployments

const API_BASE = process.env.NODE_ENV === 'production' 
  ? '' // Use relative URLs in production
  : 'http://localhost:3001';

export const apiCall = async (endpoint: string, options?: RequestInit) => {
  const url = `${API_BASE}/api${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

export const api = {
  health: () => apiCall('/health'),
  sovereignty: () => apiCall('/sovereignty'),
  providers: () => apiCall('/providers'),
  rooms: () => apiCall('/rooms'),
  sessions: () => apiCall('/sessions'),
  
  chat: (data: {
    message: string;
    room?: string;
    model?: string;
    sessionId?: string;
  }) => apiCall('/chat', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  embed: (data: {
    content: string;
    room?: string;
  }) => apiCall('/embed', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  search: (data: {
    query: string;
    room?: string;
    limit?: number;
  }) => apiCall('/search', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};