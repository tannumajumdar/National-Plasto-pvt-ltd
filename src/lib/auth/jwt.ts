import { SignJWT, jwtVerify } from "jose";

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
}

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET is missing or too short. Set a value of at least 32 characters in .env",
    );
  }
  return new TextEncoder().encode(secret);
}

const ISSUER = "national-plasto";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setSubject(payload.sub)
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

/** Returns null on any failure — expired, tampered, or malformed. */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: ISSUER });
    if (!payload.sub || !payload.email || !payload.role) return null;
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      name: (payload.name as string) ?? "",
      role: payload.role as "USER" | "ADMIN",
    };
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = MAX_AGE_SECONDS;
export const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || "np_session";
