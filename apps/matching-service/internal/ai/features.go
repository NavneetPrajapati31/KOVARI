package ai

import (
	"math"
	"strings"
	"time"

	"github.com/kovari/matching-service/internal/models"
)

const EarthRadiusKm = 6371.0
const NeutralScore = 0.5

func clamp01(v float64) float64 {
	if v < 0 {
		return 0
	}
	if v > 1 {
		return 1
	}
	return v
}

func parseDateMs(s string) float64 {
	layouts := []string{time.RFC3339, "2006-01-02"}
	for _, l := range layouts {
		t, err := time.Parse(l, s)
		if err == nil {
			return float64(t.UnixNano() / int64(time.Millisecond))
		}
	}
	return math.NaN()
}

func haversineKm(a, b models.Coordinates) float64 {
	dLat := (b.Lat - a.Lat) * math.Pi / 180
	dLon := (b.Lon - a.Lon) * math.Pi / 180
	lat1 := a.Lat * math.Pi / 180
	lat2 := b.Lat * math.Pi / 180

	sinDLat := math.Sin(dLat / 2)
	sinDLon := math.Sin(dLon / 2)
	h := sinDLat*sinDLat + math.Cos(lat1)*math.Cos(lat2)*sinDLon*sinDLon
	c := 2 * math.Atan2(math.Sqrt(h), math.Sqrt(1-h))
	return EarthRadiusKm * c
}

func distanceScore(a, b models.Coordinates) float64 {
	d := haversineKm(a, b)
	if math.IsInf(d, 0) || math.IsNaN(d) {
		return NeutralScore
	}
	if d <= 25 {
		return 1.0
	}
	if d <= 50 {
		return 0.95
	}
	if d <= 100 {
		return 0.85
	}
	if d <= 150 {
		return 0.75
	}
	if d <= 200 {
		return 0.6
	}
	return 0
}

func dateOverlapScore(startA, endA, startB, endB string, matchType models.MatchType) float64 {
	sA := parseDateMs(startA)
	eA := parseDateMs(endA)
	sB := parseDateMs(startB)
	eB := parseDateMs(endB)

	if math.IsNaN(sA) || math.IsNaN(eA) || math.IsNaN(sB) || math.IsNaN(eB) {
		return 0
	}

	overlapStart := math.Max(sA, sB)
	overlapEnd := math.Min(eA, eB)
	overlapMs := math.Max(0, overlapEnd-overlapStart)
	overlapDays := overlapMs / (1000.0 * 60 * 60 * 24)

	if overlapDays < 1 {
		return 0
	}

	durA := eA - sA
	durB := eB - sB
	var denom float64
	if matchType == models.MatchTypeUserGroup {
		denom = durA
	} else {
		denom = math.Max(durA, durB)
	}

	if denom <= 0 {
		return 0
	}

	actualRatio := overlapMs / denom
	if actualRatio >= 0.8 {
		return 1.0
	}
	if actualRatio >= 0.5 {
		return 0.9
	}
	if actualRatio >= 0.3 {
		return 0.8
	}
	if actualRatio >= 0.2 {
		return 0.6
	}
	if actualRatio >= 0.1 {
		return 0.3
	}
	return 0.1
}

func budgetScore(a, b float64, matchType models.MatchType) float64 {
	if matchType == models.MatchTypeUserUser {
		maxBudget := math.Max(a, b)
		if maxBudget == 0 {
			return 1.0
		}
		ratio := math.Abs(a-b) / maxBudget
		if ratio <= 0.1 {
			return 1.0
		}
		if ratio <= 0.25 {
			return 0.8
		}
		if ratio <= 0.5 {
			return 0.6
		}
		if ratio <= 1.0 {
			return 0.4
		}
		if ratio <= 2.0 {
			return 0.2
		}
		return 0.1
	}

	// Group: 1 - diff/40000
	diff := math.Abs(a - b)
	score := 1 - diff/40000.0
	return clamp01(score)
}

func jaccard(a, b []string, addBonus bool) float64 {
	if len(a) == 0 || len(b) == 0 {
		return NeutralScore
	}

	setA := make(map[string]bool)
	for _, v := range a {
		setA[strings.ToLower(strings.TrimSpace(v))] = true
	}
	setB := make(map[string]bool)
	for _, v := range b {
		setB[strings.ToLower(strings.TrimSpace(v))] = true
	}

	intersection := 0
	for k := range setA {
		if setB[k] {
			intersection++
		}
	}

	union := len(setA) + len(setB) - intersection
	if union == 0 {
		return NeutralScore
	}

	score := float64(intersection) / float64(union)
	if addBonus && intersection > 0 {
		score = math.Min(1.0, score+0.2)
	}
	return clamp01(score)
}

func ageScore(a, b float64) float64 {
	diff := math.Abs(a - b)
	if diff <= 2 {
		return 1.0
	}
	if diff <= 5 {
		return 0.9
	}
	if diff <= 10 {
		return 0.7
	}
	if diff <= 15 {
		return 0.5
	}
	if diff <= 25 {
		return 0.3
	}
	if diff <= 40 {
		return 0.1
	}
	return 0.05
}

func personalityScore(p1, p2 string) float64 {
	if p1 == "" || p2 == "" {
		return NeutralScore
	}
	p1 = strings.ToLower(p1)
	p2 = strings.ToLower(p2)

	scores := map[string]map[string]float64{
		"introvert": {"introvert": 1.0, "ambivert": 0.7, "extrovert": 0.4},
		"ambivert":  {"introvert": 0.7, "ambivert": 1.0, "extrovert": 0.7},
		"extrovert": {"introvert": 0.4, "ambivert": 0.7, "extrovert": 1.0},
	}

	if s, ok := scores[p1]; ok {
		if v, ok := s[p2]; ok {
			return v
		}
	}
	return 0
}

func groupSizeScore(size int) float64 {
	if size <= 0 {
		return NeutralScore
	}
	if size <= 6 {
		return 1.0
	}
	if size <= 12 {
		return 0.8
	}
	if size <= 20 {
		return 0.6
	}
	if size <= 40 {
		return 0.4
	}
	return 0.2
}

func groupDiversityScore(languages, nationalities []string) float64 {
	langScore := NeutralScore
	if len(languages) > 0 {
		if len(languages) >= 3 {
			langScore = 1.0
		} else if len(languages) == 2 {
			langScore = 0.7
		} else {
			langScore = 0.5
		}
	}

	nationalityScore := NeutralScore
	if len(nationalities) > 0 {
		if len(nationalities) >= 3 {
			nationalityScore = 1.0
		} else if len(nationalities) == 2 {
			nationalityScore = 0.7
		} else {
			nationalityScore = 0.5
		}
	}

	return (langScore + nationalityScore) / 2.0
}

func ExtractSoloFeatures(user, match models.SoloSession) models.MLFeatures {
	uA := user.StaticAttributes
	if uA == nil {
		uA = &models.StaticAttributes{}
	}
	mA := match.StaticAttributes
	if mA == nil {
		mA = &models.StaticAttributes{}
	}

	dist := distanceScore(user.Destination.ToCoords(), match.Destination.ToCoords())
	dates := dateOverlapScore(user.StartDate, user.EndDate, match.StartDate, match.EndDate, models.MatchTypeUserUser)
	budget := budgetScore(user.Budget, match.Budget, models.MatchTypeUserUser)
	interests := jaccard(uA.Interests, mA.Interests, true)
	age := ageScore(float64(uA.Age), float64(mA.Age))
	personality := personalityScore(uA.Personality, mA.Personality)

	return models.MLFeatures{
		MatchType:           models.MatchTypeUserUser,
		DistanceScore:       dist,
		DateOverlapScore:    dates,
		BudgetScore:         budget,
		InterestScore:       interests,
		AgeScore:            age,
		PersonalityScore:    personality,
		DestinationInterest: clamp01(dist * interests),
		DateBudget:          clamp01(dates * budget),
	}
}

func ExtractGroupFeatures(user models.SoloSession, group models.GroupProfile) models.MLFeatures {
	uA := user.StaticAttributes
	if uA == nil {
		uA = &models.StaticAttributes{}
	}

	userCoords := user.Destination.ToCoords()
	groupCoords := group.Destination.ToCoords()

	dist := distanceScore(userCoords, groupCoords)
	dates := dateOverlapScore(user.StartDate, user.EndDate, group.StartDate, group.EndDate, models.MatchTypeUserGroup)
	budget := budgetScore(user.Budget, group.AverageBudget, models.MatchTypeUserGroup)
	interests := jaccard(uA.Interests, group.TopInterests, false)
	age := ageScore(float64(uA.Age), group.AverageAge)

	return models.MLFeatures{
		MatchType:           models.MatchTypeUserGroup,
		DistanceScore:       dist,
		DateOverlapScore:    dates,
		BudgetScore:         budget,
		InterestScore:       interests,
		AgeScore:            age,
		PersonalityScore:    NeutralScore,
		DestinationInterest: clamp01(dist * interests),
		DateBudget:          clamp01(dates * budget),
		GroupSizeScore:      groupSizeScore(group.Size),
		GroupDiversityScore: groupDiversityScore(group.DominantLanguages, group.DominantNationalities),
	}
}
