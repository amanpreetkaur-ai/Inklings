
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET() {
  try {
    const result = await prisma.$queryRaw<
      { database_name: string; server_time: Date }[]
    >`
      SELECT current_database() AS database_name, NOW() AS server_time
    `;

    const [authors, books, genres, languages] = await Promise.all([
      prisma.author.count(),
      prisma.book.count(),
      prisma.genre.count(),
      prisma.language.count(),
    ]);

    return NextResponse.json({
      success: true,
      message: "Supabase and Prisma catalogue connection successful!",
      database: result[0].database_name,
      serverTime: result[0].server_time,
      catalogue: {
        authors,
        books,
        genres,
        languages,
      },
    });
  } catch (error) {
    console.error("Database test failed:", error);

    return NextResponse.json(
      { success: false, message: "Database connection failed." },
      { status: 500 }
    );
  }
}
