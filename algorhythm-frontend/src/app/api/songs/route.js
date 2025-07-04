// src/app/api/songs/route.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function GET(request) {
  const db = await open({
    filename: "./songs.db",
    driver: sqlite3.Database,
  });

  const search = request.nextUrl.searchParams.get("q");
  let rows;

  if (search) {
    const query = `%${search.toLowerCase()}%`;
    rows = await db.all(
      "SELECT * FROM songs WHERE LOWER(name) LIKE ? OR LOWER(artist) LIKE ? LIMIT 200",
      query,
      query
    );
  } else {
    rows = await db.all("SELECT * FROM songs ORDER BY RANDOM() LIMIT 100");
  }

  const totalCountRow = await db.get("SELECT COUNT(*) as count FROM songs");
  const totalCount = totalCountRow?.count || 0;

  const stream = [JSON.stringify({ totalCount }), ...rows.map((row) => JSON.stringify(row))].join("\n");

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
