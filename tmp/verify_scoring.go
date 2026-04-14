package main

import (
	"fmt"
	"math"
)

func GetHaversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371
	dLat := (lat2 - lat1) * (math.Pi / 180)
	dLon := (lon2 - lon1) * (math.Pi / 180)
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*(math.Pi/180))*math.Cos(lat2*(math.Pi/180))*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return float64(R) * c
}

func main() {
	lat1, lon1 := 19.08, 72.88 // Mumbai
	lat2, lon2 := 21.17, 72.83 // Surat
	
	distance := GetHaversineDistance(lat1, lon1, lat2, lon2)
	fmt.Printf("Distance: %.2f km\n", distance)
	
	maxDist := 1500.0
	score := 1.0 - math.Min(distance/maxDist, 1.0)
	fmt.Printf("Score (1500km): %.4f\n", score)
	
	oldMaxDist := 200.0
	oldScore := math.Max(0, 1.0 - distance/oldMaxDist)
	fmt.Printf("Old Score (200km): %.4f\n", oldScore)
}
