// app/api/session/route.ts
import { NextResponse } from 'next/server';
import { storeSessionPreference, getAllActiveSessions } from '../redis/session';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, destination, budget, mode, date } = body;

    // Validate required fields
    if (!userId || !destination || !budget || !mode || !date) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Optional: Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
    }

    await storeSessionPreference(userId, { destination, budget, mode, date });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Session error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const sessions = await getAllActiveSessions();
    return NextResponse.json({ sessions });
  } catch (err) {
    console.error("Fetch sessions error:", err);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}
