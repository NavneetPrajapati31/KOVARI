"use client"

import { useEffect, useState } from "react"
import { Input } from "@/shared/components/ui/input"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { format } from "date-fns"

interface Event {
  id: string
  title: string
  description: string
  date: string
  link: string
  image_url: string
  location: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [location, setLocation] = useState("India")
  const [date, setDate] = useState("")

  const fetchEvents = async () => {
    const params = new URLSearchParams()
    if (location) params.append("location", location)
    if (date) params.append("date", date)

    const res = await fetch(`/api/events?${params.toString()}`)
    const data = await res.json()
    setEvents(data)
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Upcoming Events</h1>

      <div className="flex gap-4">
        <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button onClick={fetchEvents}>Search</Button>
      </div>

      {events.length === 0 ? (
        <p className="text-muted-foreground">No events found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {events.map((event) => (
            <Card key={event.id}>
              {event.image_url && (
                <img src={event.image_url} alt={event.title} className="w-full h-40 object-cover rounded-t" />
              )}
              <CardContent className="p-4 space-y-2">
                <h3 className="text-lg font-semibold line-clamp-1">{event.title}</h3>
                <p className="text-sm text-muted-foreground">{event.location}</p>
                <p className="text-sm text-muted-foreground">{format(new Date(event.date), "PPPpp")}</p>
                <a href={event.link} target="_blank" className="text-sm text-blue-600 underline">
                  View on Eventbrite
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
