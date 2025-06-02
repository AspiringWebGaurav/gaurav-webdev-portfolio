// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const visitIdCookie = request.cookies.get("visitId");
  const uuidCookie = request.cookies.get("uuid");

  if (!visitIdCookie) {
    const visitId = uuidv4();
    response.cookies.set("visitId", visitId, {
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });
  }

  if (!uuidCookie) {
    const uuid = uuidv4();
    response.cookies.set("uuid", uuid, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  return response;
}
