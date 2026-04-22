import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import type { Role } from "@prisma/client";

const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "HR_ADMIN"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    (pathname.startsWith("/admin") && pathname !== "/admin/login") ||
    pathname.startsWith("/api/admin")
  ) {
    const token = req.cookies.get("auth_token")?.value;

    if (!token) {
      return pathname.startsWith("/api/admin")
        ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        : NextResponse.redirect(new URL("/admin/login", req.url));
    }

    try {
      const payload = verifyToken(token);
      if (!ADMIN_ROLES.includes(payload.role)) {
        return pathname.startsWith("/api/admin")
          ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
          : NextResponse.redirect(new URL("/admin/login", req.url));
      }
    } catch {
      return pathname.startsWith("/api/admin")
        ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        : NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
