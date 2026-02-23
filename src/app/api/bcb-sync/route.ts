import { NextResponse } from "next/server";
import { fetchBcbRateForMonth } from "@/lib/bcb-api";
import { upsertRate } from "@/services/rates.service";

export async function GET() {
  try {
    const now = new Date();
    const results: Array<{ month: number; year: number; rate: number; status: string }> = [];

    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const entry = await fetchBcbRateForMonth(month, year);
      if (entry) {
        await upsertRate(month, year, entry.rate, false);
        results.push({ month, year, rate: entry.rate, status: "synced" });
      } else {
        results.push({ month, year, rate: 0, status: "not_found" });
      }
    }

    return NextResponse.json({ ok: true, synced: results.length, results });
  } catch (error) {
    console.error("BCB sync error:", error);
    return NextResponse.json({ ok: false, error: "Sync failed" }, { status: 500 });
  }
}
