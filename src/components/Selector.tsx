"use client"

import { useState } from "react"
import { ArrowRight, Search, MapPin, Calendar, Users, Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// import DestinationSelector from "./components/destination-selector"
// import DateSelector from "./components/date-selector"
// import TravelerSelector from "./components/traveler-selector"
// import TransportSelector from "./components/transport-selector"

// import type { TravelSelection, Destination, TravelDates, TravelerConfig, TransportMode } from "./types/travel"

interface TravelSelectorProps {
  onSearch?: (selection: TravelSelection) => void
  className?: string
}

export default function TravelSelector({ onSearch, className }: TravelSelectorProps) {
  const [selection, setSelection] = useState<TravelSelection>({
    destination: null,
    dates: {
      departure: null,
      return: null,
      flexible: false,
      flexibilityDays: 0,
    },
    travelers: {
      adults: 2,
      children: [],
      infants: 0,
      rooms: 1,
    },
    transport: null,
    tripType: "roundtrip",
  })

  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { id: "destination", label: "Where", icon: MapPin, component: "destination" },
    { id: "dates", label: "When", icon: Calendar, component: "dates" },
    { id: "travelers", label: "Who", icon: Users, component: "travelers" },
    { id: "transport", label: "How", icon: Plane, component: "transport" },
  ]

  const handleDestinationSelect = (destination: Destination) => {
    setSelection((prev) => ({ ...prev, destination }))
  }

  const handleDateSelect = (dates: TravelDates) => {
    setSelection((prev) => ({ ...prev, dates }))
  }

  const handleTravelerSelect = (travelers: TravelerConfig) => {
    setSelection((prev) => ({ ...prev, travelers }))
  }

  const handleTransportSelect = (transport: TransportMode) => {
    setSelection((prev) => ({ ...prev, transport }))
  }

  const handleTripTypeChange = (tripType: "roundtrip" | "oneway" | "multicity") => {
    setSelection((prev) => ({
      ...prev,
      tripType,
      dates: {
        ...prev.dates,
        return: tripType === "oneway" ? null : prev.dates.return,
      },
    }))
  }

  const handleSearch = () => {
    onSearch?.(selection)
  }

  const isStepComplete = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return !!selection.destination
      case 1:
        return !!selection.dates.departure && (selection.tripType === "oneway" || !!selection.dates.return)
      case 2:
        return selection.travelers.adults > 0
      case 3:
        return !!selection.transport
      default:
        return false
    }
  }

  const canSearch = () => {
    return (
      selection.destination &&
      selection.dates.departure &&
      (selection.tripType === "oneway" || selection.dates.return) &&
      selection.travelers.adults > 0 &&
      selection.transport
    )
  }

  const getStepSummary = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return selection.destination?.name || "Select destination"
      case 1:
        if (!selection.dates.departure) return "Select dates"
        if (selection.tripType === "oneway") return `${selection.dates.departure.toLocaleDateString()}`
        return selection.dates.return
          ? `${selection.dates.departure.toLocaleDateString()} - ${selection.dates.return.toLocaleDateString()}`
          : `${selection.dates.departure.toLocaleDateString()} - Return date`
      case 2:
        const total = selection.travelers.adults + selection.travelers.children.length + selection.travelers.infants
        return `${total} traveler${total !== 1 ? "s" : ""}, ${selection.travelers.rooms} room${selection.travelers.rooms !== 1 ? "s" : ""}`
      case 3:
        return selection.transport?.name || "Select transport"
      default:
        return ""
    }
  }

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Search className="h-5 w-5" />
            Plan Your Perfect Trip
          </CardTitle>

          {/* Trip Type Selector */}
          <Tabs value={selection.tripType} onValueChange={(value) => handleTripTypeChange(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="roundtrip">Round Trip</TabsTrigger>
              <TabsTrigger value="oneway">One Way</TabsTrigger>
              <TabsTrigger value="multicity">Multi-City</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === index
              const isComplete = isStepComplete(index)

              return (
                <div key={step.id} className="flex items-center">
                  <Button
                    variant={isActive ? "default" : isComplete ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setCurrentStep(index)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{step.label}</span>
                    {isComplete && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        ✓
                      </Badge>
                    )}
                  </Button>
                  {index < steps.length - 1 && <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />}
                </div>
              )
            })}
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {currentStep === 0 && (
              <DestinationSelector onSelect={handleDestinationSelect} selected={selection.destination} />
            )}

            {currentStep === 1 && (
              <DateSelector onSelect={handleDateSelect} selected={selection.dates} tripType={selection.tripType} />
            )}

            {currentStep === 2 && <TravelerSelector onSelect={handleTravelerSelect} selected={selection.travelers} />}

            {currentStep === 3 && <TransportSelector onSelect={handleTransportSelect} selected={selection.transport} />}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            <div className="flex-1 mx-4">
              <div className="text-center text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </div>
              <div className="text-center text-xs mt-1">{getStepSummary(currentStep)}</div>
            </div>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                disabled={!isStepComplete(currentStep)}
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleSearch} disabled={!canSearch()} className="bg-primary hover:bg-primary/90">
                <Search className="h-4 w-4 mr-2" />
                Search Trips
              </Button>
            )}
          </div>

          {/* Selection Summary */}
          {canSearch() && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Trip Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Destination:</span>
                    <div className="font-medium">
                      {selection.destination?.name}, {selection.destination?.country}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dates:</span>
                    <div className="font-medium">{getStepSummary(1)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Travelers:</span>
                    <div className="font-medium">{getStepSummary(2)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Transport:</span>
                    <div className="font-medium">{selection.transport?.name}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
