import { NextResponse } from "next/server";
import { liveStore } from "@/lib/liveStore";

export async function GET() {
  return NextResponse.json(liveStore.getState());
}
