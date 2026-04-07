package matching

import (
	"math"
	"strings"

	"github.com/kovari/matching-service/internal/models"
)

func CalculateGroupBudgetScore(userBudget, groupAvgBudget float64) float64 {
	if groupAvgBudget <= userBudget {
		return 1.0
	}
	diff := groupAvgBudget - userBudget
	return math.Max(0, 1-diff/40000.0)
}

func CalculateGroupAgeScore(userAge int, groupAvgAge float64) float64 {
	if groupAvgAge == 0 {
		return 0.5
	}
	diff := math.Abs(float64(userAge) - groupAvgAge)
	return math.Max(0, 1-diff/20.0)
}

func CalculateGroupLifestyleScore(user models.SoloSession, group models.GroupProfile) float64 {
	uA := user.StaticAttributes
	smokingScore := 0.0
	uSmoke := uA != nil && strings.EqualFold(uA.Smoking, "yes")
	if (uSmoke && group.SmokingPolicy == "Smokers Welcome") || (!uSmoke && group.SmokingPolicy == "Non-Smoking") {
		smokingScore = 1.0
	} else if group.SmokingPolicy == "Mixed" {
		smokingScore = 0.6
	}

	drinkingScore := 0.0
	uDrink := uA != nil && strings.EqualFold(uA.Drinking, "yes")
	if (uDrink && group.DrinkingPolicy == "Drinkers Welcome") || (!uDrink && group.DrinkingPolicy == "Non-Drinking") {
		drinkingScore = 1.0
	} else if group.DrinkingPolicy == "Mixed" {
		drinkingScore = 0.6
	}

	return (smokingScore + drinkingScore) / 2.0
}

func CalculateGroupBackgroundScore(user models.SoloSession, group models.GroupProfile) float64 {
	uA := user.StaticAttributes
	if uA == nil || uA.Nationality == "" || uA.Nationality == "Unknown" || uA.Nationality == "Any" {
		return 0.5
	}
	for _, n := range group.DominantNationalities {
		if strings.EqualFold(n, uA.Nationality) {
			return 1.0
		}
	}
	return 0.0
}

func CalculateDistanceDecayScore(distanceKm, maxKm float64) float64 {
	if distanceKm <= 0 {
		return 0.5 // Neutral/Unknown fallback
	}
	if distanceKm >= maxKm {
		return 0
	}
	return 1.0 - (distanceKm / maxKm)
}

func CalculateGroupDateOverlapScore(start1, end1, start2, end2 string) float64 {
	overlapDays, tripDuration := CalculateDateOverlapGroup(start1, end1, start2, end2)
	if overlapDays < 1 || tripDuration <= 0 {
		return 0
	}
	return math.Min(1.0, overlapDays/tripDuration)
}

func CalculateFinalGroupScore(user models.SoloSession, group models.GroupProfile, mlScore *float64, config *models.MatchingConfig) models.GroupMatchResult {
	budgetScore := CalculateGroupBudgetScore(user.Budget, group.AverageBudget)
	dateOverlapScore := CalculateGroupDateOverlapScore(user.StartDate, user.EndDate, group.StartDate, group.EndDate)
	
	var interestScore, ageScore, languageScore float64
	uA := user.StaticAttributes
	if uA != nil {
		interestScore = CalculateJaccardSimilarity(uA.Interests, group.TopInterests)
		ageScore = CalculateGroupAgeScore(uA.Age, group.AverageAge)
		languageScore = CalculateJaccardSimilarity(uA.Languages, group.DominantLanguages)
	} else {
		// Minimum penalty if user profile missing at this stage (should have been filtered)
		interestScore, ageScore, languageScore = 0.3, 0.5, 0.3
	}
	
	lifestyleScore := CalculateGroupLifestyleScore(user, group)
	backgroundScore := CalculateGroupBackgroundScore(user, group)
	distanceScore := CalculateDistanceDecayScore(group.DistanceKm, 1500.0)

	weights := config.GroupWeights
	ruleBasedScore := budgetScore*weights["budget"] +
		dateOverlapScore*weights["dates"] +
		interestScore*weights["interests"] +
		ageScore*weights["age"] +
		languageScore*weights["language"] +
		lifestyleScore*weights["lifestyle"] +
		backgroundScore*weights["background"] +
		distanceScore*weights["distance"]

	finalScore := ruleBasedScore
	if mlScore != nil {
		adjustedMl := *mlScore
		// Non-linear boost for conservative group ML scores
		if adjustedMl > 0 && adjustedMl < 0.3 {
			adjustedMl *= 3.5
		} else if adjustedMl >= 0.3 && adjustedMl < 0.6 {
			adjustedMl *= 1.5
		}
		if adjustedMl > 0.95 {
			adjustedMl = 0.95
		}

		mlBlend := config.MLBlend["group"]
		finalScore = adjustedMl*mlBlend + ruleBasedScore*(1.0-mlBlend)
	}

	// Sum then round to match TS exactly
	finalScore = math.Round(finalScore*1000) / 1000

	return models.GroupMatchResult{
		Group: group,
		Score: finalScore,
		MLScore: mlScore,
		Breakdown: map[string]float64{
			"budget":    math.Round(budgetScore*1000) / 1000,
			"dates":     math.Round(dateOverlapScore*1000) / 1000,
			"interests": math.Round(interestScore*1000) / 1000,
			"age":       math.Round(ageScore*1000) / 1000,
		},
	}
}
