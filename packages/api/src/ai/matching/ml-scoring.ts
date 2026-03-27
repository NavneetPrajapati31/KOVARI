/**
 * ML-Based Compatibility Scoring
 * 
 * This module integrates the trained XGBoost model into the matching algorithm.
 * Falls back to rule-based scoring if ML prediction fails.
 */

import { SoloSession } from "@kovari/types";
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
  enabled?: boolean;
  fallbackOnError?: boolean;
  modelDir?: string;
  mlServerUrl?: string;
  useHttpApi?: boolean;
}

let predictionQueue: Array<{
  resolve: (result: MLPredictionResult) => void;
  reject: (error: Error) => void;
  features: CompatibilityFeatures;
  options: MLScoringOptions;
}> = [];
let isProcessingQueue = false;

async function processPredictionQueue() {
  if (isProcessingQueue || predictionQueue.length === 0) {
    return;
  }
  isProcessingQueue = true;
  while (predictionQueue.length > 0) {
    const { resolve, features, options } = predictionQueue.shift()!;
    try {
      const result = await executeMLPredictionSpawn(features, options);
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

async function executeMLPredictionHttp(
  features: CompatibilityFeatures,
  options: MLScoringOptions = {}
): Promise<MLPredictionResult> {
  const { mlServerUrl } = options;
  const serverUrl = mlServerUrl || process.env.ML_SERVER_URL || "http://127.0.0.1:8001";
  
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
    ...(features.matchType === "user_group"
      ? {
          groupSizeScore: features.groupSizeScore ?? 0,
          groupDiversityScore: features.groupDiversityScore ?? 0,
        }
      : {}),
  };

  try {
    const response = await fetch(`${serverUrl}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        features: featuresPayload,
        model_dir: options.modelDir || "models",
      }),
      signal: AbortSignal.timeout(2000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json() as MLPredictionResult;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️  ML HTTP prediction failed: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

export async function executeMLPredictionBatch(
  featuresList: CompatibilityFeatures[],
  options: MLScoringOptions = {}
): Promise<MLPredictionResult[]> {
  const { mlServerUrl } = options;
  const serverUrl = mlServerUrl || process.env.ML_SERVER_URL || "http://127.0.0.1:8001";
  
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
    ...(features.matchType === "user_group"
      ? {
          groupSizeScore: features.groupSizeScore ?? 0,
          groupDiversityScore: features.groupDiversityScore ?? 0,
        }
      : {}),
  }));

  try {
    const response = await fetch(`${serverUrl}/predict/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        features_list: featuresPayloadList,
        model_dir: options.modelDir || "models",
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const batchResult = await response.json() as { success: boolean; results?: MLPredictionResult[]; error?: string };
    if (!batchResult.success || !batchResult.results) {
      throw new Error(batchResult.error || "Batch prediction failed");
    }
    return batchResult.results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️  ML batch HTTP prediction failed: ${errorMessage}`);
    return await Promise.all(featuresList.map(features => predictML(features, options)));
  }
}

async function executeMLPredictionSpawn(
  features: CompatibilityFeatures,
  options: MLScoringOptions = {}
): Promise<MLPredictionResult> {
  const { enabled = true } = options;
  if (!enabled) return { success: false, error: "ML scoring is disabled" };

  try {
    const featuresJson = JSON.stringify({
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
      ...(features.matchType === "user_group"
        ? {
            groupSizeScore: features.groupSizeScore ?? 0,
            groupDiversityScore: features.groupDiversityScore ?? 0,
          }
        : {}),
    });

    const projectRoot = process.cwd();
    // Path needs to be adjusted. If we are in packages/api, where is the python script?
    // Let's assume the user keeps it in a predictable location or we move it too.
    const scriptPath = join(projectRoot, "packages/api/src/ai/datasets/ml-prediction-server.py");
    const modelPath = join(projectRoot, options.modelDir || "models");

    return new Promise<MLPredictionResult>((resolve) => {
      const pythonProcess = spawn("python", [scriptPath, modelPath], {
        cwd: projectRoot,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let resolved = false;

      pythonProcess.stdout.on("data", (data) => { stdout += data.toString(); });
      pythonProcess.stderr.on("data", (data) => { stderr += data.toString(); });

      pythonProcess.on("close", (code) => {
        if (resolved) return;
        resolved = true;
        if (stdout.trim()) {
          try {
            resolve(JSON.parse(stdout.trim()));
            return;
          } catch {}
        }
        resolve({ success: false, error: stderr || `Exited with code ${code}` });
      });

      pythonProcess.on("error", (error) => {
        if (!resolved) {
          resolved = true;
          resolve({ success: false, error: error.message });
        }
      });

      pythonProcess.on("spawn", () => {
        if (pythonProcess.stdin && !pythonProcess.stdin.destroyed) {
          pythonProcess.stdin.write(featuresJson, "utf8", () => {
            pythonProcess.stdin.end();
          });
        }
      });

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          pythonProcess.kill("SIGKILL");
          resolve({ success: false, error: "Prediction timeout" });
        }
      }, 15000);
    });
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function executeMLPrediction(
  features: CompatibilityFeatures,
  options: MLScoringOptions = {}
): Promise<MLPredictionResult> {
  const { useHttpApi = true, enabled = true } = options;
  if (!enabled) return { success: false, error: "ML scoring is disabled" };

  if (useHttpApi) {
    const httpResult = await executeMLPredictionHttp(features, options);
    if (httpResult.success) return httpResult;
  }

  return new Promise<MLPredictionResult>((resolve, reject) => {
    predictionQueue.push({ resolve, reject, features, options });
    processPredictionQueue();
  });
}

export async function predictML(
  features: CompatibilityFeatures,
  options: MLScoringOptions = {}
): Promise<MLPredictionResult> {
  return executeMLPrediction(features, options);
}

export async function calculateMLCompatibilityScore(
  userSession: SoloSession,
  matchSession: SoloSession,
  options: MLScoringOptions = {}
): Promise<number | null> {
  try {
    const features = extractCompatibilityFeatures(
      "user_user",
      {
        destination: userSession.destination,
        startDate: userSession.startDate || userSession.startDate,
        endDate: userSession.endDate || userSession.endDate,
        budget: userSession.budget,
        static_attributes: userSession.static_attributes,
      },
      {
        destination: matchSession.destination,
        startDate: matchSession.startDate || matchSession.startDate,
        endDate: matchSession.endDate || matchSession.endDate,
        budget: matchSession.budget,
        static_attributes: matchSession.static_attributes,
      }
    );

    const prediction = await predictML(features, options);
    return (prediction.success && prediction.score !== undefined) ? prediction.score : null;
  } catch (error) {
    return null;
  }
}

export async function calculateMLCompatibilityScoresBatch(
  userSession: SoloSession,
  matchSessions: SoloSession[],
  options: MLScoringOptions = {}
): Promise<Map<string, number | null>> {
  const results = new Map<string, number | null>();
  if (matchSessions.length === 0) return results;

  try {
    const featuresList = matchSessions.map(ms => extractCompatibilityFeatures(
      "user_user",
      {
        destination: userSession.destination,
        startDate: userSession.startDate,
        endDate: userSession.endDate,
        budget: userSession.budget,
        static_attributes: userSession.static_attributes,
      },
      {
        destination: ms.destination,
        startDate: ms.startDate,
        endDate: ms.endDate,
        budget: ms.budget,
        static_attributes: ms.static_attributes,
      }
    ));

    const batchResults = await executeMLPredictionBatch(featuresList, options);
    for (let i = 0; i < matchSessions.length; i++) {
      const prediction = batchResults[i];
      const userId = matchSessions[i].userId;
      if (userId) {
        results.set(userId, (prediction?.success && prediction.score !== undefined) ? prediction.score : null);
      }
    }
    return results;
  } catch (error) {
    return results;
  }
}

export async function calculateMLGroupCompatibilityScore(
  userProfile: any,
  groupProfile: any,
  options: MLScoringOptions = {}
): Promise<number | null> {
  try {
    const features = extractCompatibilityFeatures("user_group", userProfile, groupProfile);
    const prediction = await predictML(features, options);
    return (prediction.success && prediction.score !== undefined) ? prediction.score : null;
  } catch (error) {
    return null;
  }
}

export async function calculateMLGroupCompatibilityScoresBatch(
  userProfile: any,
  groups: any[],
  options: MLScoringOptions = {}
): Promise<Map<string, number | null>> {
  const results = new Map<string, number | null>();
  if (groups.length === 0) return results;

  try {
    const featuresList = groups.map(group => extractCompatibilityFeatures(
      "user_group",
      userProfile,
      group
    ));

    const batchResults = await executeMLPredictionBatch(featuresList, options);
    for (let i = 0; i < groups.length; i++) {
      const prediction = batchResults[i];
      const groupId = groups[i].id;
      if (groupId) {
        results.set(groupId, (prediction?.success && prediction.score !== undefined) ? prediction.score : null);
      }
    }
    return results;
  } catch (error) {
    return results;
  }
}
