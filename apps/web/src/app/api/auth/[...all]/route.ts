import { getAuth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await getAuth();
  return auth.handler(req);
}

export async function POST(req: NextRequest) {
  const auth = await getAuth();
  return auth.handler(req);
}
