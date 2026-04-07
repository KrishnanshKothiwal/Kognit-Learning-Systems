// Helper to get Firebase ID token for API calls
import { auth } from './firebase';

export async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  try {
    // forceRefresh=false: uses cached token unless near expiry (Firebase handles refresh)
    const token = await user.getIdToken(false);
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

export async function getAuthHeaders(): Promise<{ Authorization: string } | {}> {
  const token = await getAuthToken();
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}
