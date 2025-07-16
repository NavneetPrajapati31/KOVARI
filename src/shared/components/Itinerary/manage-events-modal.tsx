"use client"
import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { formatTime } from "../../utils/utils" // Import the shared utility

interface ItineraryEvent {
  id: string
  time: {
    hour: number
    minute: number
    ampm: "AM" | "PM"
  }
  label?: string
  description: string
  duration: string
  active: boolean
}

interface ManageEventsModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "add" | "edit" | "delete" | null
  events: ItineraryEvent[]
  onSave: (event: ItineraryEvent) => void
  onDelete: (eventId: string) => void
}

export function ManageEventsModal({ isOpen, onClose, mode, events, onSave, onDelete }: ManageEventsModalProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [hour, setHour] = useState("")
  const [minute, setMinute] = useState("")
  const [ampm, setAmpm] = useState<"AM" | "PM">("AM")
  const [label, setLabel] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState("")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isValid, setIsValid] = useState(false)

  const validateForm = useCallback(() => {
    const errs: typeof errors = {}
    let valid = true

    const h = Number(hour)
    const m = Number(minute)

    if (isNaN(h) || h < 1 || h > 12) {
      errs.hour = "Hour must be between 1 and 12"
      valid = false
    }

    if (isNaN(m) || m < 0 || m > 59) {
      errs.minute = "Minute must be between 0 and 59"
      valid = false
    }

    if (!description.trim()) {
      errs.description = "Description is required"
      valid = false
    }

    if (!duration.trim()) {
      errs.duration = "Duration is required"
      valid = false
    }

    setErrors(errs)
    setIsValid(valid)
    return valid
  }, [hour, minute, description, duration])

  useEffect(() => {
    if (mode === "edit" && selectedEventId) {
      const e = events.find((ev) => ev.id === selectedEventId)
      if (e) {
        setHour(e.time.hour.toString())
        setMinute(e.time.minute.toString())
        setAmpm(e.time.ampm)
        setLabel(e.label ?? "")
        setDescription(e.description ?? "")
        setDuration(e.duration ?? "")
      }
    } else if (mode === "add") {
      setHour("")
      setMinute("")
      setAmpm("AM")
      setLabel("")
      setDescription("")
      setDuration("")
      setSelectedEventId(null)
    }
    setErrors({})
  }, [mode, selectedEventId, events])

  useEffect(() => {
    if (mode === "add" || mode === "edit") validateForm()
  }, [hour, minute, description, duration, validateForm, mode])

  const parseDuration = (raw: string) => {
    let h = 0
    let m = 0
    const hourMatch = raw.match(/(\d+)\s*(h|hour|hours)/i)
    const minMatch = raw.match(/(\d+)\s*(m|min|minute|minutes)/i)
    if (hourMatch) h = Number.parseInt(hourMatch[1])
    if (minMatch) m = Number.parseInt(minMatch[1])
    if (!h && !m) return raw // fallback if no specific format found
    return `${h ? `${h}h ` : ""}${m ? `${m}m` : ""}`.trim()
  }

  const handleSubmit = () => {
    if (!validateForm()) return
    const parsedDuration = parseDuration(duration)

    onSave({
      id: selectedEventId || crypto.randomUUID(),
      time: {
        hour: Number.parseInt(hour),
        minute: Number.parseInt(minute),
        ampm: ampm,
      },
      label,
      description,
      duration: parsedDuration,
      active: false,
    })
    onClose()
  }

  const handleDelete = () => {
    if (selectedEventId) {
      onDelete(selectedEventId)
      setSelectedEventId(null)
      onClose()
    }
  }

  const renderContent = () => {
    if (mode === "delete") {
      return (
        <>
          <Label>Select Event to Delete</Label>
          {events.length > 0 ? (
            <Select onValueChange={setSelectedEventId} value={selectedEventId || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {`${formatTime(e.time)} - ${e.description}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-gray-500 mt-2">No events to delete.</p>
          )}
          {selectedEventId && (
            <p className="text-sm text-red-600 mt-4">
              Are you sure you want to delete{" "}
              <strong>"{events.find((e) => e.id === selectedEventId)?.description}"</strong>? This action cannot be
              undone.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!selectedEventId}>
              Delete
            </Button>
          </DialogFooter>
        </>
      )
    }

    return (
      <>
        {mode === "edit" && (
          <div className="mb-4">
            <Label>Select Event to Edit</Label>
            <Select onValueChange={setSelectedEventId} value={selectedEventId || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {`${formatTime(e.time)} - ${e.description}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Time Input */}
        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
          <Label className="text-left sm:text-right">Time</Label>
          <div className="col-span-full sm:col-span-3 flex flex-col sm:flex-row gap-2">
            <Input
              type="number"
              min="1"
              max="12"
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              placeholder="HH"
              className="w-full sm:w-1/3"
            />
            <span className="hidden sm:flex items-center">:</span> {/* Hide colon on small screens */}
            <Input
              type="number"
              min="0"
              max="59"
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              placeholder="MM"
              className="w-full sm:w-1/3"
            />
            <Select onValueChange={(val) => setAmpm(val as "AM" | "PM")} value={ampm}>
              <SelectTrigger className="w-full sm:w-1/3">
                <SelectValue placeholder="AM/PM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {errors.hour && <p className="text-xs text-red-500">{errors.hour}</p>}
        {errors.minute && <p className="text-xs text-red-500">{errors.minute}</p>}

        {/* Label */}
        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
          <Label className="text-left sm:text-right">Label</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="col-span-full sm:col-span-3"
            placeholder="e.g. Flight, Lunch"
          />
        </div>

        {/* Description */}
        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
          <Label className="text-left sm:text-right">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="col-span-full sm:col-span-3"
            placeholder="Add more details"
          />
        </div>
        {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}

        {/* Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
          <Label className="text-left sm:text-right">Duration</Label>
          <Input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="col-span-full sm:col-span-3"
            placeholder="e.g. 1h 30m, 45 minutes"
          />
        </div>
        {errors.duration && <p className="text-xs text-red-500">{errors.duration}</p>}

        <DialogFooter className="mt-4">
          <Button onClick={handleSubmit} disabled={!isValid || (mode === "edit" && !selectedEventId)}>
            {mode === "add" ? "Add Event" : "Save Changes"}
          </Button>
        </DialogFooter>
      </>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New Event" : mode === "edit" ? "Edit Event" : "Delete Event"}
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
