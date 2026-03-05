import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  try {
    const sets = await prisma.card.findMany({
      where: q
        ? { setName: { contains: q, mode: "insensitive" } }
        : undefined,
      select: { setCode: true, setName: true },
      distinct: ["setCode"],
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json(
      sets
        .filter((s) => s.setName)
        .map((s) => ({ code: s.setCode, name: s.setName! }))
    );
  } catch (err) {
    console.error("Sets API error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
