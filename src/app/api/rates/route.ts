import { NextRequest, NextResponse } from "next/server";
import { getRateForMonth, listRates } from "@/services/rates.service";

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month");
  const year = request.nextUrl.searchParams.get("year");

  if (month && year) {
    const rate = await getRateForMonth(Number(month), Number(year));
    if (!rate) return NextResponse.json({ rate: null });
    return NextResponse.json({ rate: Number(rate.rate) });
  }

  const rates = await listRates(24);
  return NextResponse.json(rates);
}
