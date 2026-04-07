package config

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"os"
	"path/filepath"

	"github.com/kovari/matching-service/internal/models"
)

func LoadMatchingConfig(pkgConfigPath string) (*models.MatchingConfig, string, error) {
	absPath, err := filepath.Abs(pkgConfigPath)
	if err != nil {
		return nil, "", err
	}

	data, err := os.ReadFile(absPath)
	if err != nil {
		return nil, "", err
	}

	// Calculate hash of raw file content for parity verification
	hash := sha256.Sum256(data)
	configHash := hex.EncodeToString(hash[:])

	var config models.MatchingConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, "", err
	}

	return &config, configHash, nil
}
