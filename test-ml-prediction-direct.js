/**
 * Direct ML Prediction Test
 * 
 * Tests the ML model prediction directly without going through the API
 */

const { spawn } = require('child_process');
const path = require('path');

async function testMLPrediction() {
  console.log('🧪 Testing ML Model Prediction Directly\n');
  console.log('='.repeat(80));

  // Test with sample features
  const testFeatures = {
    matchType: 'user_user',
    distanceScore: 1.0,
    dateOverlapScore: 0.9,
    budgetScore: 0.8,
    interestScore: 0.5,
    ageScore: 0.7,
    personalityScore: 0.6,
    languageScore: 0,
    lifestyleScore: 0,
    backgroundScore: 0,
  };

  console.log('📊 Test Features:');
  console.log(JSON.stringify(testFeatures, null, 2));
  console.log('');

  const featuresJson = JSON.stringify(testFeatures);
  const scriptPath = path.join(process.cwd(), 'src/lib/ai/datasets/predict.py');
  const modelPath = path.join(process.cwd(), 'models');

  console.log('🔍 Running ML Prediction...\n');

  return new Promise((resolve) => {
    const pythonProcess = spawn('python', [scriptPath, '--model-dir', modelPath], {
      cwd: process.cwd(),
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    pythonProcess.on('close', (code) => {
      console.log('\n' + '='.repeat(80));
      if (code === 0) {
        try {
          const result = JSON.parse(stdout.trim());
          if (result.success) {
            console.log('✅ ML Prediction Successful!');
            console.log(`   Score: ${result.score.toFixed(3)}`);
            console.log(`   Probability: ${result.probability.toFixed(3)}`);
            console.log(`   Prediction: ${result.prediction === 1 ? 'Accept' : 'Ignore'}`);
          } else {
            console.log('❌ ML Prediction Failed');
            console.log(`   Error: ${result.error}`);
          }
        } catch (error) {
          console.log('❌ Failed to parse ML result');
          console.log(`   Output: ${stdout}`);
          console.log(`   Error: ${error.message}`);
        }
      } else {
        console.log(`❌ Python process exited with code ${code}`);
        if (stderr) {
          console.log(`   Error: ${stderr}`);
        }
      }
      console.log('='.repeat(80));
      resolve();
    });

    pythonProcess.on('error', (error) => {
      console.log(`❌ Failed to spawn Python process`);
      console.log(`   Error: ${error.message}`);
      console.log('💡 Make sure Python is installed and in PATH');
      resolve();
    });

    // Write features to stdin
    pythonProcess.stdin.write(featuresJson);
    pythonProcess.stdin.end();

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!pythonProcess.killed) {
        pythonProcess.kill();
        console.log('\n❌ Prediction timeout (10 seconds)');
        resolve();
      }
    }, 10000);
  });
}

testMLPrediction().catch(console.error);
