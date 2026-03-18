/**
 * ML-Based Compatibility Scoring
 * 
 * This module integrates the trained XGBoost model into the matching algorithm.
 * Falls back to rule-based scoring if ML prediction fails.
 */

import { SoloSession } from "@/types";
import { extractCompatibilityFeatures } from "../features/compatibility-features";
import { CompatibilityFeatures } from "../utils/ml-types";
import { spawn } from "child_process";
import { join } from "path";

interface MLPredictionResult {
  success: boolean;
  probability?: number;
  prediction?: number;
  score?: number;
  error?: string;
}

interface MLScoringOptions {
  /** Enable ML scoring (default: true) */
  enabled?: boolean;
  /** Fallback to rule-based if ML fails (default: true) */
  fallbackOnError?: boolean;
  /** Model directory path (default: "models") */
  modelDir?: string;
  /** ML server URL (default: from env or "http://localhost:8001") */
  mlServerUrl?: string;
  /** Use HTTP API instead of spawning Python (default: true) */
  useHttpApi?: boolean;
}

// Prediction queue to serialize ML predictions and prevent timeout issues
// Model loading takes ~8-12s, so we queue predictions to avoid parallel timeouts
let predictionQueue: Array<{
  resolve: (result: MLPredictionResult) => void;
  reject: (error: Error) => void;
  features: CompatibilityFeatures;
  options: MLScoringOptions;
}> = [];
let isProcessingQueue = false;

/**
 * Process the prediction queue serially to avoid timeout issues
 */
async function processPredictionQueue() {
  if (isProcessingQueue || predictionQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (predictionQueue.length > 0) {
    const { resolve, features, options } = predictionQueue.shift()!;
    try {
      const result = await executeMLPrediction(features, options);
      resolve(result);
    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  isProcessingQueue = false;
}

/**
 * Execute ML prediction using HTTP API (FastAPI server)
 */
async function executeMLPredictionHttp(
  features: CompatibilityFeatures,
  options: MLScoringOptions = {}
): Promise<MLPredictionResult> {
  const { modelDir = "models", mlServerUrl } = options;
  
  const serverUrl = mlServerUrl || process.env.ML_SERVER_URL || "http://localhost:8001";
  const featuresPayload = {
    matchType: features.matchType,
    distanceScore: features.distanceScore,
    dateOverlapScore: features.dateOverlapScore,
    budgetScore: features.budgetScore,
    interestScore: features.interestScore,
    ageScore: features.ageScore,
    personalityScore: features.personalityScore ?? 0,
    destination_interest: features.destination_interest ?? (features.distanceScore * features.interestScore),
    date_budget: features.date_budget ?? (features.dateOverlapScore * features.budgetScore),
    languageScore: 0,
    lifestyleScore: 0,
    backgroundScore: 0,
  };

  try {
    const response = await fetch(`${serverUrl}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        features: featuresPayload,
        model_dir: modelDir,
      }),
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json() as MLPredictionResult;
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️  ML HTTP prediction failed: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Execute batch ML prediction using HTTP API (FastAPI server)
 */
export async function executeMLPredictionBatch(
  featuresList: CompatibilityFeatures[],
  options: MLScoringOptions = {}
): Promise<MLPredictionResult[]> {
  const { modelDir = "models", mlServerUrl } = options;
  
  const serverUrl = mlServerUrl || process.env.ML_SERVER_URL || "http://localhost:8001";
  const featuresPayloadList = featuresList.map(features => ({
    matchType: features.matchType,
    distanceScore: features.distanceScore,
    dateOverlapScore: features.dateOverlapScore,
    budgetScore: features.budgetScore,
    interestScore: features.interestScore,
    ageScore: features.ageScore,
    personalityScore: features.personalityScore ?? 0,
    destination_interest: features.destination_interest ?? (features.distanceScore * features.interestScore),
    date_budget: features.date_budget ?? (features.dateOverlapScore * features.budgetScore),
    languageScore: 0,
    lifestyleScore: 0,
    backgroundScore: 0,
  }));

  try {
    // FastAPI server batch endpoint expects POST /predict/batch with { features_list: [...] }
    const response = await fetch(`${serverUrl}/predict/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        features_list: featuresPayloadList,
        model_dir: modelDir,
      }),
      signal: AbortSignal.timeout(10000), // 10 second timeout for batch
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // FastAPI batch endpoint returns { success: true, results: [...] }
    const batchResult = await response.json() as { success: boolean; results?: MLPredictionResult[]; error?: string };
    
    if (!batchResult.success || !batchResult.results) {
      throw new Error(batchResult.error || "Batch prediction failed");
    }

    return batchResult.results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️  ML batch HTTP prediction failed: ${errorMessage}`);
    // Fallback to individual predictions
    console.log("🔄 Falling back to individual predictions...");
    const results = await Promise.all(
      featuresList.map(features => executeMLPredictionHttp(features, options))
    );
    return results;
  }
}

/**
 * Execute ML prediction using Python service (spawn process - fallback)
 */
async function executeMLPredictionSpawn(
  features: CompatibilityFeatures,
  options: MLScoringOptions = {}
): Promise<MLPredictionResult> {
  const { modelDir = "models", enabled = true } = options;

  if (!enabled) {
    return {
      success: false,
      error: "ML scoring is disabled",
    };
  }

  try {
    // Prepare features for Python script
    // Include interaction features (destination_interest, date_budget)
    // Note: Some features (languageScore, lifestyleScore, backgroundScore) may not be in the type
    // but are expected by the model. We'll use 0 as default for missing features.
    const featuresJson = JSON.stringify({
      matchType: features.matchType,
      distanceScore: features.distanceScore,
      dateOverlapScore: features.dateOverlapScore,
      budgetScore: features.budgetScore,
      interestScore: features.interestScore,
      ageScore: features.ageScore,
      personalityScore: features.personalityScore ?? 0,
      destination_interest: features.destination_interest ?? (features.distanceScore * features.interestScore), // Interaction feature
      date_budget: features.date_budget ?? (features.dateOverlapScore * features.budgetScore), // Interaction feature
      languageScore: 0, // Not in current feature extraction, model will use 0
      lifestyleScore: 0, // Not in current feature extraction, model will use 0
      backgroundScore: 0, // Not in current feature extraction, model will use 0
    });

    // Get the project root directory
    const projectRoot = process.cwd();
    // Use persistent server that caches the model in memory
    const scriptPath = join(projectRoot, "src/lib/ai/datasets/ml-prediction-server.py");
    const modelPath = join(projectRoot, modelDir);

    // Execute Python prediction script with stdin input
    // Use spawn for better stdin handling
    // Note: First call will load model (~8s), subsequent calls use cached model (<0.1s)
    return new Promise<MLPredictionResult>((resolve) => {
      const pythonProcess = spawn("python", [scriptPath, modelPath], {
        cwd: projectRoot,
        stdio: ["pipe", "pipe", "pipe"], // Explicitly set stdin, stdout, stderr
      });

      let stdout = "";
      let stderr = "";
      let resolved = false;

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (resolved) return; // Prevent double resolution
        resolved = true;

        console.log(`🔍 Python process closed with code: ${code}`);
        console.log(`   stdout length: ${stdout.length}, stderr length: ${stderr.length}`);
        if (stdout) console.log(`   stdout preview: ${stdout.substring(0, 200)}`);
        if (stderr) console.log(`   stderr: ${stderr}`);

        // Handle null exit code (process killed)
        if (code === null) {
          console.warn("⚠️  ML prediction warning: Process was killed or terminated unexpectedly");
          console.warn("   stderr:", stderr || "none");
          console.warn("   stdout:", stdout || "none");
          resolve({
            success: false,
            error: "Process terminated unexpectedly",
          });
          return;
        }

        // Check if we have output even with non-zero exit code
        if (stdout.trim()) {
          try {
            const result = JSON.parse(stdout.trim()) as MLPredictionResult;
            console.log(`✅ Parsed ML result: success=${result.success}, score=${result.score}`);
            // If we got valid JSON, use it even if exit code is non-zero
            resolve(result);
            return;
          } catch (parseError) {
            console.warn("⚠️  Failed to parse stdout as JSON:", parseError);
            console.warn("   Raw stdout:", stdout.substring(0, 200));
          }
        }

        if (code !== 0 || (stderr && !stdout.trim())) {
          console.warn("⚠️  ML prediction warning:", stderr || `Process exited with code ${code}`);
          console.warn("   Full stderr:", stderr);
          console.warn("   Full stdout:", stdout);
          resolve({
            success: false,
            error: stderr || `Process exited with code ${code}`,
          });
          return;
        }

        try {
          const result = JSON.parse(stdout.trim()) as MLPredictionResult;
          console.log(`✅ ML prediction successful: ${result.score}`);
          resolve(result);
        } catch (error) {
          console.warn("⚠️  ML prediction parse error:", error);
          console.warn("   stdout:", stdout);
          resolve({
            success: false,
            error: `Failed to parse result: ${error}`,
          });
        }
      });

      pythonProcess.on("error", (error) => {
        console.warn("⚠️  ML prediction spawn error:", error);
        resolve({
          success: false,
          error: error.message,
        });
      });

      // Write features to stdin and ensure it's properly closed
      // Wait for process to be ready before writing
      pythonProcess.on("spawn", () => {
        try {
          if (pythonProcess.stdin && !pythonProcess.stdin.destroyed) {
            // Write and immediately end stdin to signal EOF
            pythonProcess.stdin.write(featuresJson, "utf8", (error) => {
              if (error) {
                if (!resolved) {
                  resolved = true;
                  console.warn("⚠️  ML prediction stdin write error:", error);
                  resolve({
                    success: false,
                    error: `Failed to write to stdin: ${error.message}`,
                  });
                }
              } else {
                // End stdin to signal EOF to Python script
                pythonProcess.stdin.end();
              }
            });
          } else {
            if (!resolved) {
              resolved = true;
              resolve({
                success: false,
                error: "Process stdin not available",
              });
            }
          }
        } catch (error) {
          if (!resolved) {
            resolved = true;
            console.warn("⚠️  ML prediction stdin error:", error);
            resolve({
              success: false,
              error: `Failed to write to stdin: ${error instanceof Error ? error.message : String(error)}`,
            });
          }
        }
      });

      // Timeout after 25 seconds (increased to allow for model loading + prediction)
      // Model load: ~8-12s, Prediction: <0.1s, Buffer: 13s
      const timeout = setTimeout(() => {
        if (!resolved && !pythonProcess.killed) {
          resolved = true;
          console.warn("⚠️  ML prediction timeout, killing process...");
          pythonProcess.kill("SIGTERM");
          // Give it a moment to clean up
          setTimeout(() => {
            if (!pythonProcess.killed) {
              pythonProcess.kill("SIGKILL");
            }
          }, 1000);
          resolve({
            success: false,
            error: "Prediction timeout (25s)",
          });
        }
      }, 25000);

      // Clear timeout if process completes
      pythonProcess.on("close", () => {
        clearTimeout(timeout);
      });
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.warn("⚠️  ML prediction error:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Execute ML prediction - tries HTTP first, falls back to spawn
 */
async function executeMLPrediction(
  features: CompatibilityFeatures,
  options: MLScoringOptions = {}
): Promise<MLPredictionResult> {
  const { useHttpApi = true, enabled = true } = options;

  if (!enabled) {
    return {
      success: false,
      error: "ML scoring is disabled",
    };
  }

  // Try HTTP API first (FastAPI server - much faster)
  if (useHttpApi) {
    const httpResult = await executeMLPredictionHttp(features, options);
    if (httpResult.success) {
      return httpResult;
    }
    // If HTTP fails, fall back to spawn
    console.warn("⚠️  HTTP ML prediction failed, falling back to spawn process");
  }

  // Fallback to spawn process (slower but more reliable)
  return executeMLPredictionSpawn(features, options);
}

/**
 * Make ML prediction using Python service (queued to prevent timeouts)
 */
async function predictML(
  features: CompatibilityFeatures,
  options: MLScoringOptions = {}
): Promise<MLPredictionResult> {
  const { useHttpApi = true } = options;
  
  // If using HTTP API, no need to queue (server handles concurrency)
  if (useHttpApi) {
    return executeMLPredictionHttp(features, options);
  }

  // Queue predictions to serialize them and prevent parallel timeouts (spawn mode only)
  // Model loading takes ~8-12s, so parallel processes all timeout
  return new Promise<MLPredictionResult>((resolve, reject) => {
    predictionQueue.push({ resolve, reject, features, options });
    processPredictionQueue();
  });
}

/**
 * Calculate ML-enhanced compatibility score for solo matching
 * 
 * @param userSession - The searching user's session
 * @param matchSession - The potential match's session
 * @param options - ML scoring options
 * @returns ML score (0-1) or null if ML prediction failed
 */
export async function calculateMLCompatibilityScore(
  userSession: SoloSession,
  matchSession: SoloSession,
  options: MLScoringOptions = {}
): Promise<number | null> {
  try {
    // Extract compatibility features
    const features = extractCompatibilityFeatures(
      "user_user",
      {
        destination: userSession.destination,
        startDate: userSession.startDate,
        endDate: userSession.endDate,
        budget: userSession.budget,
        static_attributes: userSession.static_attributes,
      },
      {
        destination: matchSession.destination,
        startDate: matchSession.startDate,
        endDate: matchSession.endDate,
        budget: matchSession.budget,
        static_attributes: matchSession.static_attributes,
      }
    );

    // Debug: Always log features to diagnose issues
    const destination_interest = features.destination_interest ?? (features.distanceScore * features.interestScore);
    const date_budget = features.date_budget ?? (features.dateOverlapScore * features.budgetScore);
    console.log("🔍 ML Features:", JSON.stringify({
      matchType: features.matchType,
      distance: features.distanceScore.toFixed(3),
      dateOverlap: features.dateOverlapScore.toFixed(3),
      budget: features.budgetScore.toFixed(3),
      interest: features.interestScore.toFixed(3),
      age: features.ageScore.toFixed(3),
      personality: features.personalityScore.toFixed(3),
      destination_interest: destination_interest.toFixed(3),
      date_budget: date_budget.toFixed(3),
    }));

    // Make ML prediction
    console.log("🔍 Calling ML prediction service...");
    const prediction = await predictML(features, options);

    if (prediction.success && prediction.score !== undefined) {
      console.log(`✅ ML prediction successful: ${prediction.score.toFixed(3)}`);
      return prediction.score;
    }

    console.warn(`⚠️  ML prediction failed: ${prediction.error || "Unknown error"}`);
    return null;
  } catch (error) {
    console.warn("⚠️  Error in ML scoring:", error);
    return null;
  }
}

/**
 * Calculate ML-enhanced compatibility scores for multiple solo matches (BATCH)
 * 
 * This function batches all ML predictions into a single API call,
 * significantly reducing latency from ~3.7s to <1.5s for multiple matches.
 * 
 * @param userSession - The searching user's session
 * @param matchSessions - Array of potential match sessions
 * @param options - ML scoring options
 * @returns Map of match session userId -> ML score (0-1) or null if ML prediction failed
 */
export async function calculateMLCompatibilityScoresBatch(
  userSession: SoloSession,
  matchSessions: SoloSession[],
  options: MLScoringOptions = {}
): Promise<Map<string, number | null>> {
  const results = new Map<string, number | null>();
  
  if (matchSessions.length === 0) {
    return results;
  }

  try {
    // Extract features for all matches
    const featuresList: CompatibilityFeatures[] = [];
    const sessionIds: string[] = [];

    for (const matchSession of matchSessions) {
      if (!matchSession.userId) {
        console.warn("⚠️  Skipping match session without userId");
        continue;
      }
      
      const features = extractCompatibilityFeatures(
        "user_user",
        {
          destination: userSession.destination,
          startDate: userSession.startDate,
          endDate: userSession.endDate,
          budget: userSession.budget,
          static_attributes: userSession.static_attributes,
        },
        {
          destination: matchSession.destination,
          startDate: matchSession.startDate,
          endDate: matchSession.endDate,
          budget: matchSession.budget,
          static_attributes: matchSession.static_attributes,
        }
      );
      
      featuresList.push(features);
      sessionIds.push(matchSession.userId);
    }

    // Make batch ML prediction
    console.log(`🔍 Calling ML batch prediction service for ${featuresList.length} matches...`);
    const batchResults = await executeMLPredictionBatch(featuresList, options);

    // Map results back to session IDs
    for (let i = 0; i < sessionIds.length; i++) {
      const sessionId = sessionIds[i];
      const prediction = batchResults[i];
      
      if (prediction?.success && prediction.score !== undefined) {
        results.set(sessionId, prediction.score);
      } else {
        results.set(sessionId, null);
      }
    }

    const successCount = Array.from(results.values()).filter(score => score !== null).length;
    console.log(`✅ ML batch prediction: ${successCount}/${matchSessions.length} successful`);
    
    return results;
  } catch (error) {
    console.warn("⚠️  Error in batch ML scoring:", error);
    // Return null for all matches on error
    matchSessions.forEach(session => {
      if (session.userId) {
        results.set(session.userId, null);
      }
    });
    return results;
  }
}

/**
 * Calculate ML-enhanced compatibility score for group matching
 * 
 * @param userProfile - The searching user's profile
 * @param groupProfile - The potential group's profile
 * @param options - ML scoring options
 * @returns ML score (0-1) or null if ML prediction failed
 */
export async function calculateMLGroupCompatibilityScore(
  userProfile: {
    destination: { lat: number; lon: number };
    startDate: string;
    endDate: string;
    budget: number;
    age: number;
    interests?: string[];
    languages?: string[];
    smoking?: string;
    drinking?: string;
    nationality?: string;
  },
  groupProfile: {
    destination: { lat: number; lon: number };
    startDate: string;
    endDate: string;
    averageBudget: number;
    averageAge: number;
    topInterests?: string[];
    dominantLanguages?: string[];
    smokingPolicy?: string;
    drinkingPolicy?: string;
    dominantNationalities?: string[];
    size?: number;
  },
  options: MLScoringOptions = {}
): Promise<number | null> {
  try {
    // Extract compatibility features for group matching
    const features = extractCompatibilityFeatures(
      "user_group",
      {
        destination: userProfile.destination,
        startDate: userProfile.startDate,
        endDate: userProfile.endDate,
        budget: userProfile.budget,
        static_attributes: {
          age: userProfile.age,
          interests: userProfile.interests,
          smoking: userProfile.smoking,
          drinking: userProfile.drinking,
        },
      },
      {
        destination: groupProfile.destination,
        startDate: groupProfile.startDate,
        endDate: groupProfile.endDate,
        averageBudget: groupProfile.averageBudget,
        averageAge: groupProfile.averageAge,
        topInterests: groupProfile.topInterests,
        dominantLanguages: groupProfile.dominantLanguages,
        smokingPolicy: groupProfile.smokingPolicy,
        drinkingPolicy: groupProfile.drinkingPolicy,
        dominantNationalities: groupProfile.dominantNationalities,
        size: groupProfile.size,
      }
    );

    // Make ML prediction
    const prediction = await predictML(features, options);

    if (prediction.success && prediction.score !== undefined) {
      return prediction.score;
    }

    return null;
  } catch (error) {
    console.warn("⚠️  Error in ML group scoring:", error);
    return null;
  }
}

/**
 * Check if ML model is available
 */
export async function isMLModelAvailable(
  modelDir: string = "models"
): Promise<boolean> {
  try {
    const { readFileSync } = await import("fs");
    const { join } = await import("path");
    const projectRoot = process.cwd();
    const modelPath = join(projectRoot, modelDir, "match_compatibility_model.pkl");
    
    // Check if model file exists
    try {
      readFileSync(modelPath);
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}
