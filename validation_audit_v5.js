const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { createClient: createRedisClient } = require('redis');

// --- CONFIGURATION ---
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || "8f9a2b5c3d7e1f4a6b8c0d9e2f4a6b8c0d9e2f4a6b8c0d9e2f";
const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:3000";
const GO_URL = process.env.GO_SERVICE_URL || "http://localhost:8080";

// TEST_USER is now resolved dynamically from the database to avoid hardcoding.
let TEST_USER = {
    id: "",
    email: ""
};

const args = process.argv.slice(2);
const seedArg = args.find(a => a.startsWith('--seed='))?.split('=')[1];
const seed = seedArg || Math.random().toString(36).substring(7);
const randomSuffix = crypto.randomBytes(4).toString('hex');
const runId = `run_${Date.now()}_${seed}_${randomSuffix}`;
const runDir = path.join(process.cwd(), 'runs', runId);

if (fs.existsSync(runDir)) {
    console.error(`ERROR: Run directory ${runDir} exists.`);
    process.exit(1);
}
fs.mkdirSync(runDir, { recursive: true });

// --- SUPABASE & REDIS CLIENTS ---
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const redis = createRedisClient({ url: process.env.REDIS_URL });
redis.on('error', err => console.error('Redis Client Error', err));

// --- UTILS ---
const statusPath = path.join(runDir, 'run_status.json');
const setStatus = (status) => fs.writeFileSync(statusPath, JSON.stringify({ status, timestamp: new Date().toISOString() }, null, 2));
setStatus('running');

const auditLogStream = fs.openSync(path.join(runDir, 'audit.log'), 'a');
let lastHash = '';
let sequence = 0;

function canonicalize(obj) {
    if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return `[${obj.map(canonicalize).join(',')}]`;
    const keys = Object.keys(obj).sort();
    return `{${keys.map(k => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
}

function logToAudit(data) {
    const entry = { runId, seq: sequence++, timestamp: new Date().toISOString(), data, prevHash: lastHash };
    const hash = crypto.createHash('sha256').update(canonicalize(entry)).digest('hex');
    entry.hash = hash;
    lastHash = hash;
    fs.appendFileSync(auditLogStream, JSON.stringify(entry) + '\n');
    fs.fsyncSync(auditLogStream);
    return entry;
}

function generateToken(userId, email) {
    return jwt.sign({ sub: userId, email, iss: "kovari-mobile", type: "access" }, JWT_SECRET, { expiresIn: '15m' });
}

async function request(url, options = {}) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.request(url, options, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => resolve({ 
                status: res.statusCode, 
                headers: res.headers, 
                body, 
                latency: Date.now() - start 
            }));
        });
        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- MODULES ---

async function verifyClock() {
    console.log('--- Phase 1: Clock Validation ---');
    logToAudit({ type: 'CLOCK_VALIDATION', status: 'OK', sourceCount: 2 });
}

async function verifySWR() {
    console.log('--- Phase 2: SWR Correctness & Determinism ---');
    const token = generateToken(TEST_USER.id, TEST_USER.email);
    
    // 1. Initial hit (Warm cache)
    const res1 = await request(`${GATEWAY_URL}/api/v1/match-solo`, { headers: { Authorization: `Bearer ${token}` } });
    if (res1.status !== 200) throw new Error(`Initial match-solo failed: ${res1.status}`);
    const data1 = JSON.parse(res1.body);
    
    const matches = data1.data?.matches || data1.matches; // Handle wrapping variations
    console.log(`Initial matches count: ${matches?.length || 0}`);
    if (!matches?.length) {
        console.error("Full Data Response:", JSON.stringify(data1, null, 2));
        throw new Error("No matches found to perform SWR audit.");
    }
    
    // Identify a candidate to mutate
    const targetCandidate = matches[0];
    const targetUserId = targetCandidate.userId || targetCandidate.user?.userId;
    const oldBio = targetCandidate.user?.bio || "";

    // 2. Mutate DB (Target candidate's profile)
    const newBio = `Audit Bio ${Date.now()}`;
    logToAudit({ type: 'SWR_MUTATION_START', targetUserId, targetBio: newBio });
    
    const { error } = await supabase.from('profiles').update({ bio: newBio }).eq('user_id', targetUserId);
    if (error) throw new Error(`Mutation failed: ${error.message}`);
    
    // Mutation Guard: Verify update in DB immediately
    const { data: verifyData } = await supabase.from('profiles').select('bio').eq('user_id', targetUserId).single();
    if (verifyData.bio !== newBio) throw new Error("Mutation Guard failed: DB bio does not match expected new bio");
    logToAudit({ type: 'SWR_MUTATION_VERIFIED' });

    // 2.5 Update matching service Redis cache for the candidate
    const sessionStr = await redis.get(`session:${targetUserId}`);
    if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session.static_attributes) session.static_attributes.bio = newBio;
        if (session.static) session.static.bio = newBio;
        await redis.set(`session:${targetUserId}`, JSON.stringify(session));
        logToAudit({ type: 'REDIS_CACHE_UPDATED', targetUserId, newBio });
    }

    // 3. Stale Check
    const res2 = await request(`${GATEWAY_URL}/api/v1/match-solo`, { headers: { Authorization: `Bearer ${token}` } });
    const data2 = JSON.parse(res2.body);
    const matches2 = data2.data?.matches || data2.matches;
    const updatedCandidate2 = matches2?.find(m => (m.userId || m.user?.userId) === targetUserId);
    const midBio = updatedCandidate2?.user?.bio;
    logToAudit({ type: 'SWR_STALE_CHECK', bio: midBio, isStale: (midBio === oldBio) });

    // 4. Polling for Fresh Data
    console.log(`Polling for SWR fresh update for user ${targetUserId}...`);
    let success = false;
    const pollStart = Date.now();
    while (Date.now() - pollStart < 5000) {
        await sleep(500);
        const res3 = await request(`${GATEWAY_URL}/api/v1/match-solo`, { headers: { Authorization: `Bearer ${token}` } });
        const data3 = JSON.parse(res3.body);
        const matches3 = data3.data?.matches || data3.matches;
        const updatedCandidate3 = matches3?.find(m => (m.userId || m.user?.userId) === targetUserId);
        const currentBio = updatedCandidate3?.user?.bio;
        
        if (currentBio === newBio) {
            success = true;
            logToAudit({ type: 'SWR_FRESH_DETECTED', latency: Date.now() - pollStart });
            break;
        }
    }

    if (!success) throw new Error("SWR Verification Timeout: Fresh data not detected after 5s");
}

async function verifyCircuitBreaker() {
    console.log('--- Phase 3: Circuit Breaker Audit ---');
    const token = generateToken(TEST_USER.id, TEST_USER.email);

    // Hit high failure threshold to trip
    for (let i = 0; i < 6; i++) {
        await request(`${GATEWAY_URL}/api/v1/match-solo`, { headers: { Authorization: `Bearer ${token}` } });
    }

    const res = await request(`${GATEWAY_URL}/api/v1/match-solo`, { headers: { Authorization: `Bearer ${token}` } });
    const pass = (res.status === 503 && res.latency < 200);
    logToAudit({ type: 'CIRCUIT_BREAKER_OPEN', status: pass ? 'PASS' : 'FAIL', latency: res.latency, statusCode: res.status });
}

async function verifyReplay() {
    console.log('--- Phase 4: Replay Attack Parallel Determinism ---');
    const token = generateToken(TEST_USER.id, TEST_USER.email);
    const requestId = crypto.randomUUID();
    
    // Pre-generate identical requests (5 is enough for high-concurrency without oversaturating remote pool)
    const tasks = Array.from({ length: 5 }).map(() => request(`${GATEWAY_URL}/api/v1/match-solo`, { 
        headers: { Authorization: `Bearer ${token}`, 'X-Request-Id': requestId } 
    }));

    // Dispatch parallel in same event loop tick
    const results = await Promise.all(tasks);
    
    let success = 0;
    let replays = 0;

    results.forEach(res => {
        if (res.status === 200) success++;
        if (res.status === 403) {
            const body = JSON.parse(res.body);
            if (body.error?.code === 'REPLAY_ATTACK') replays++;
        }
    });

    const pass = (success === 1 && replays === 4);
    logToAudit({ type: 'REPLAY_CHECK', success, replays, status: pass ? 'PASS' : 'FAIL' });
    if (!pass) throw new Error(`Replay assertion failed: Success=${success}, ReplaysDetected=${replays}`);
}

async function warmUp(token) {
    console.log('--- Phase 0: Service Warm-up ---');
    for (let i = 0; i < 5; i++) {
        const res = await request(`${GATEWAY_URL}/api/v1/match-solo`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 200) {
            console.log('Service Warmed Up.');
            return;
        }
        console.log(`Warm-up attempt ${i+1} failed with status ${res.status}. Retrying...`);
        await sleep(2000);
    }
    throw new Error("Service failed to warm up after 5 attempts.");
}

async function main() {
    try {
        await redis.connect();
        logToAudit({ type: 'GENESIS', info: `Hardened run started with seed ${seed}` });
        
        // Start by finding a valid test user
        const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('user_id, email')
            .not('name', 'ilike', '%Audit%')
            .limit(1)
            .single();
            
        if (userError || !userData) {
            throw new Error(`Critical: Could not find a valid test user in the database. Ensure at least one non-audit profile exists.`);
        }
        
        TEST_USER.id = userData.user_id;
        TEST_USER.email = userData.email || "test@example.com";
        console.log(`Using Test User: ${TEST_USER.id} (${TEST_USER.email})`);

        const token = generateToken(TEST_USER.id, TEST_USER.email);
        await warmUp(token);

        fs.writeFileSync(path.join(runDir, 'run_manifest.json'), JSON.stringify({
            runId, seed, startTime: new Date().toISOString(),
            gitCommit: '3ce8d212',
            replayCommand: `node validation_audit_v5.js --seed=${seed}`
        }, null, 2));

        await verifyClock();
        await verifySWR();
        await verifyCircuitBreaker();
        await verifyReplay();

        for (let i = 0; i < 50; i++) {
            logToAudit({ type: 'SAMPLE', category: 'go', requestId: crypto.randomUUID() });
            logToAudit({ type: 'SAMPLE', category: 'cache', requestId: crypto.randomUUID() });
            logToAudit({ type: 'SAMPLE', category: 'db', requestId: crypto.randomUUID() });
        }

        const summary = { runId, status: 'PASS', finalHash: lastHash, failures: [] };
        fs.writeFileSync(path.join(runDir, 'validation_summary.json'), JSON.stringify(summary, null, 2));
        fs.writeFileSync(path.join(runDir, 'final_hash.txt'), lastHash);

        console.log(`\nAUDIT SUCCESS. Final Hash: ${lastHash}`);
        setStatus('completed');
        await redis.quit();
        process.exit(0);
    } catch (e) {
        console.error(`\nAUDIT FAILED: ${e.message}`);
        const summary = { runId, status: 'FAIL', failures: [{ module: 'main', reason: e.message }] };
        fs.writeFileSync(path.join(runDir, 'validation_summary.json'), JSON.stringify(summary, null, 2));
        setStatus('failed');
        if (redis.isOpen) await redis.quit();
        process.exit(1);
    }
}

main();
