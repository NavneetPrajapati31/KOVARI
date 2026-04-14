import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface MatchingConfig {
  version: string;
  soloWeights: Record<string, number>;
  groupWeights: Record<string, number>;
  mlBlend: {
    solo: number;
    group: number;
  };
}

let cachedConfig: MatchingConfig | null = null;

export function getSharedMatchingConfig(): MatchingConfig {
  if (cachedConfig) return cachedConfig;

  try {
    // Path: packages/api/src/matching/config-loader.ts
    // Looking for: packages/config/matching.json
    // In monorepo: Root/packages/api/src/matching/config-loader.ts
    // Target: Root/packages/config/matching.json
    
    const rootDir = process.cwd();
    // In Next.js, process.cwd() is usually the app dir (apps/web)
    // We need to find the monorepo root.
    
    let configPath = path.join(rootDir, "../../packages/config/matching.json");
    
    // Fallback for different environments (e.g., if running from root or package dir)
    if (!fs.existsSync(configPath)) {
      configPath = path.join(rootDir, "packages/config/matching.json");
    }
    
    if (!fs.existsSync(configPath)) {
        // Last resort: Relative to this file
        configPath = path.resolve(__dirname, "../../../../config/matching.json");
    }

    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, "utf-8");
      cachedConfig = JSON.parse(data);
      
      // Calculate and log config hash of RAW FILE for parity verification
      const hash = crypto.createHash("sha256").update(data).digest("hex");
      console.log("Matching Config Loaded:", cachedConfig);
      console.log("Config Hash:", hash);
      
      return cachedConfig!;
    }
  } catch (err) {
    console.error("Failed to load matching config:", err);
  }

  // Absolute fallback to match the prompt's version if file reading fails
  return {
    version: "v1-fallback",
    soloWeights: {
      destination: 0.25,
      dates: 0.20,
      budget: 0.20,
      interests: 0.10,
      personality: 0.10,
      age: 0.05,
      lifestyle: 0.05,
      location: 0.05
    },
    groupWeights: {
      budget: 0.18,
      dates: 0.20,
      interests: 0.15,
      age: 0.10
    },
    mlBlend: {
      solo: 0.6,
      group: 0.3
    }
  };
}
