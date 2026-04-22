import type { Role, User } from "@prisma/client";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "HR_ADMIN"];

export type AuthenticatedAdmin = Pick<User, "id" | "email" | "role" | "isActive">;

async function getRequestCookieToken() {
  const cookieStore = await cookies();
  return cookieStore.get("auth_token")?.value ?? null;
}

async function getAppOrigin() {
  const explicitBaseUrl = process.env.APP_BASE_URL?.trim();
  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/+$/, "");
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") || "http";

  if (host) {
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

export async function getAuthenticatedAdmin(
  allowedRoles: Role[] = ADMIN_ROLES
): Promise<AuthenticatedAdmin | null> {
  const token = await getRequestCookieToken();
  if (!token) return null;

  try {
    const payload = verifyToken(token);

    if (!allowedRoles.includes(payload.role)) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive || !allowedRoles.includes(user.role)) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export async function requireAdminPageAccess(allowedRoles: Role[] = ADMIN_ROLES) {
  const user = await getAuthenticatedAdmin(allowedRoles);
  if (!user) {
    return NextResponse.redirect(new URL("/admin/login", await getAppOrigin()));
  }
  return user;
}

export async function requireAdminApiAccess(allowedRoles: Role[] = ADMIN_ROLES) {
  const user = await getAuthenticatedAdmin(allowedRoles);
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
    };
  }

  return { error: null, user };
}

export function validateSameOrigin(req: Request) {
  const requestUrl = new URL(req.url);
  const originHeader = req.headers.get("origin");
  const refererHeader = req.headers.get("referer");

  if (originHeader) {
    const origin = new URL(originHeader);
    if (origin.origin !== requestUrl.origin) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
  } else if (refererHeader) {
    const referer = new URL(refererHeader);
    if (referer.origin !== requestUrl.origin) {
      return NextResponse.json({ error: "Invalid referer" }, { status: 403 });
    }
  } else {
    return NextResponse.json(
      { error: "Missing origin headers" },
      { status: 403 }
    );
  }

  return null;
}

export const adminRoles = ADMIN_ROLES;
