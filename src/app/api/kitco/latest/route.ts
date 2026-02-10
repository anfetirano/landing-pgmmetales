import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch("https://api.kitco.com/api/v1/precious-metals", {
    headers: {
      "User-Agent": "PMGMetales/1.0",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Kitco fetch failed" }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
