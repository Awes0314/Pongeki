import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// https://ongeki-score.net/user/{id}/rating のHTMLを取得するAPI
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const url = `https://ongeki-score.net/user/${encodeURIComponent(id)}/rating`;
  const res = await fetch(url);
  const html = await res.text();
  return NextResponse.json({ html });
}