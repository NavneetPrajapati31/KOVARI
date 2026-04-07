package models

type MatchType string

const (
	MatchTypeUserUser  MatchType = "user_user"
	MatchTypeUserGroup MatchType = "user_group"
)

type MLFeatures struct {
	MatchType           MatchType `json:"matchType"`
	DistanceScore       float64   `json:"distanceScore"`
	DateOverlapScore    float64   `json:"dateOverlapScore"`
	BudgetScore         float64   `json:"budgetScore"`
	InterestScore       float64   `json:"interestScore"`
	AgeScore            float64   `json:"ageScore"`
	PersonalityScore    float64   `json:"personalityScore"`
	DestinationInterest float64   `json:"destination_interest"`
	DateBudget          float64   `json:"date_budget"`
	LanguageScore       float64   `json:"languageScore,omitempty"`
	LifestyleScore      float64   `json:"lifestyleScore,omitempty"`
	BackgroundScore     float64   `json:"backgroundScore,omitempty"`
	GroupSizeScore      float64   `json:"groupSizeScore,omitempty"`
	GroupDiversityScore float64   `json:"groupDiversityScore,omitempty"`
}

type MLBatchRequest struct {
	FeaturesList []MLFeatures `json:"features_list"`
	ModelDir     string       `json:"model_dir"`
}

type MLPredictionResult struct {
	Success     bool    `json:"success"`
	Probability float64 `json:"probability,omitempty"`
	Score       float64 `json:"score,omitempty"`
	Error       string  `json:"error,omitempty"`
}

type MLBatchResponse struct {
	Success bool                 `json:"success"`
	Results []MLPredictionResult `json:"results"`
	Error   string               `json:"error,omitempty"`
}
