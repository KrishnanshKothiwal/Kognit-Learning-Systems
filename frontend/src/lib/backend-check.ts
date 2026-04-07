// Backend connection check utility
import axios from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

let backendStatus: 'checking' | 'online' | 'offline' = 'checking';
let lastCheck: number = 0;
const CHECK_INTERVAL = 30000; // Check every 30 seconds

export async function checkBackendConnection(): Promise<boolean> {
  const now = Date.now();
  
  // Use cached status if recent
  if (backendStatus !== 'checking' && (now - lastCheck) < CHECK_INTERVAL) {
    return backendStatus === 'online';
  }
  
  backendStatus = 'checking';
  lastCheck = now;
  
  try {
    const response = await axios.get(`${API_URL}/health`, {
      timeout: 3000,
      validateStatus: (status) => status < 500 // Accept any status < 500
    });
    // If we get a response (even if error), backend is reachable
    backendStatus = 'online';
    return true;
  } catch (error: any) {
    // Network errors mean backend is offline
    if (axios.isAxiosError(error) && (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message.includes('Network Error'))) {
      backendStatus = 'offline';
      return false;
    }
    // Other errors (like 404) mean backend is online but endpoint might be wrong
    backendStatus = 'online';
    return true;
  }
}

export function getBackendStatus(): 'checking' | 'online' | 'offline' {
  return backendStatus;
}

