import { OAuth2Client } from "google-auth-library";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

export interface GooglePayload {
  email: string;
  name?: string;
  googleId: string;
}

/**
 * Verifies a Google ID Token sent from the mobile app
 */
export async function verifyGoogleToken(idToken: string): Promise<GooglePayload | null> {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_ID, 
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      return null;
    }

    return {
      email: payload.email,
      name: payload.name,
      googleId: payload.sub,
    };
  } catch (error) {
    console.error("Failed to verify Google ID token:", error);
    return null;
  }
}
