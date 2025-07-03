import { NextRequest, NextResponse } from "next/server"

const EVENTBRITE_TOKEN = process.env.EB_API_KEY

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const location = searchParams.get("location") || "India"
  const date = searchParams.get("date")

  const queryParams = new URLSearchParams({
    "location.address": location,
    expand: "venue",
    "start_date.range_start": date ? new Date(date).toISOString() : new Date().toISOString(),
    "sort_by": "date",
  })

  const res = await fetch(`https://www.eventbriteapi.com/v3/events/search/?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${EVENTBRITE_TOKEN}`,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json({ error: data.error_description || "Failed to fetch events" }, { status: 500 })
  }

  const events = data.events.map((event: any) => ({
    id: event.id,
    title: event.name.text,
    description: event.description.text,
    date: event.start.local,
    link: event.url,
    image_url: event.logo?.url,
    location: event.venue?.address?.localized_address_display || "Online",
  }))

  return NextResponse.json(events)
}
