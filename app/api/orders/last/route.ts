import { NextResponse } from "next/server";
import { getLastOrderDb } from "@/app/server/orders";

export async function GET() {
  const order = await getLastOrderDb();
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}
