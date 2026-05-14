import { NextResponse } from "next/server";
import { liveStore } from "@/lib/liveStore";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(liveStore.getState(), {
    headers: {
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}
