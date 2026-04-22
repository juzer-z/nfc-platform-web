import { NextResponse } from "next/server";

function clearAuthCookie(response: NextResponse) {
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAuthCookie(response);
  return response;
}

export async function GET(req: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", req.url));
  clearAuthCookie(response);
  return response;
}
