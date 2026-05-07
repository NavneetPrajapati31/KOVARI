const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// --- CANONICAL JSON (Must match generator exactly) ---
function canonicalize(obj) {
    if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return `[${obj.map(canonicalize).join(',')}]`;
    const keys = Object.keys(obj).sort();
    return `{${keys.map(k => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
}

async function verify(logPath) {
    const runDir = path.dirname(logPath);
    console.log(`Verifying Audit Log: ${logPath}`);

    const timeout = setTimeout(() => {
        console.error('ERROR: Verification TIMEOUT (30s exceeded).');
        process.exit(1);
    }, 30000);

    try {
        const statusPath = path.join(runDir, 'run_status.json');
        if (!fs.existsSync(statusPath)) {
            console.error('[FAILED] CHAIN_INVALID: run_status.json missing.');
            process.exit(1);
        }
        const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
        if (status.status !== 'completed') {
            console.error(`[FAILED] CHAIN_INCOMPLETE: Run status is "${status.status}".`);
            process.exit(1);
        }

        const logContent = fs.readFileSync(logPath, 'utf8');
        const lines = logContent.split('\n').filter(l => l.trim());
        
        // 1. Chain Completeness Assertion
        const MIN_RECORDS = 150;
        if (lines.length < MIN_RECORDS) {
            console.error(`[FAILED] CHAIN_TRUNCATED: Only ${lines.length} records found (min ${MIN_RECORDS} expected).`);
            process.exit(1);
        }

        let lastHash = '';
        let expectedSequence = 0;

        for (const line of lines) {
            const entry = JSON.parse(line);
            const entryHash = entry.hash;
            delete entry.hash;

            // 2. Sequence Verification
            if (entry.seq !== expectedSequence) {
                console.error(`[FAILED] CHAIN_INVALID_SEQUENCE: Gap at seq ${entry.seq} (expected ${expectedSequence})`);
                process.exit(1);
            }

            // 3. Hash Chain Continuity
            if (entry.prevHash !== lastHash) {
                console.error(`[FAILED] CHAIN_DISCONTINUITY: Hash chain broken at seq ${entry.seq}.`);
                process.exit(1);
            }

            // 4. Data Integrity (Early Exit on mismatch)
            const canonicalData = canonicalize(entry);
            const calculatedHash = crypto.createHash('sha256').update(canonicalData).digest('hex');

            if (calculatedHash !== entryHash) {
                console.error(`[FAILED] HASH_MISMATCH: Seq ${entry.seq} data tampered!`);
                process.exit(1);
            }

            lastHash = calculatedHash;
            expectedSequence++;
        }

        const finalHashTxt = fs.readFileSync(path.join(runDir, 'final_hash.txt'), 'utf8').trim();
        const summary = JSON.parse(fs.readFileSync(path.join(runDir, 'validation_summary.json'), 'utf8'));

        if (lastHash !== finalHashTxt || lastHash !== summary.finalHash) {
            console.error('[FAILED] FINGERPRINT_MISMATCH: Chain head does not match artifact manifest.');
            process.exit(1);
        }

        console.log('-------------------------------------------');
        console.log('VERIFICATION SUCCESS: HASH_VALID');
        console.log(`Total Records: ${expectedSequence}`);
        console.log(`Final Hash: ${lastHash}`);
        console.log('-------------------------------------------');
        
        clearTimeout(timeout);
        process.exit(0);
    } catch (e) {
        console.error(`VERIFICATION FATAL ERROR: ${e.message}`);
        process.exit(1);
    }
}

const targetLog = process.argv[2];
if (!targetLog) {
    console.error('Usage: node verify_audit_log.js <path_to_audit.log>');
    process.exit(1);
}

verify(path.resolve(targetLog));
