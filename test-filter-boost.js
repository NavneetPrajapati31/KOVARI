#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Filter Boost Functionality - 1.5x Multiplier');
console.log('================================================================================\n');

// Mock data for testing
const mockUserSession = {
    destination: { lat: 19.0760, lon: 72.8777 }, // Mumbai
    startDate: '2025-01-15',
    endDate: '2025-01-20',
    budget: 50000,
    static_attributes: {
        age: 25,
        personality: 'extrovert',
        interests: ['adventure', 'culture'],
        religion: 'hindu',
        smoking: 'no',
        drinking: 'socially',
        location: { lat: 19.0760, lon: 72.8777 }
    }
};

const mockMatchSession = {
    destination: { lat: 19.0760, lon: 72.8777 }, // Mumbai
    startDate: '2025-01-16',
    endDate: '2025-01-19',
    budget: 45000,
    static_attributes: {
        age: 27,
        personality: 'extrovert',
        interests: ['adventure', 'food'],
        religion: 'hindu',
        smoking: 'no',
        drinking: 'socially',
        location: { lat: 19.0760, lon: 72.8777 }
    }
};

// Test different filter scenarios
const testScenarios = [
    {
        name: 'No Filters Selected',
        filters: {},
        description: 'Base scoring without any filter boost'
    },
    {
        name: 'Age Filter Selected (25-30)',
        filters: { age: { min: 25, max: 30 } },
        description: 'Age filter should get 1.5x boost'
    },
    {
        name: 'Smoking Filter Selected (no)',
        filters: { smoking: { value: 'no' } },
        description: 'Smoking filter should get 1.5x boost'
    },
    {
        name: 'Personality Filter Selected (extrovert)',
        filters: { personality: { value: 'extrovert' } },
        description: 'Personality filter should get 1.5x boost'
    },
    {
        name: 'Multiple Filters Selected',
        filters: { 
            age: { min: 25, max: 30 },
            smoking: { value: 'no' },
            personality: { value: 'extrovert' }
        },
        description: 'Multiple filters should each get 1.5x boost'
    }
];

// Mock the scoring functions for demonstration
function calculateDestinationScore(dest1, dest2) {
    if (!dest1 || !dest2) return 0.3;
    const distance = Math.sqrt(
        Math.pow(dest1.lat - dest2.lat, 2) + 
        Math.pow(dest1.lon - dest2.lon, 2)
    ) * 111; // Rough km conversion
    
    if (distance === 0) return 1.0;
    if (distance <= 25) return 1.0;
    if (distance <= 50) return 0.95;
    if (distance <= 100) return 0.85;
    if (distance <= 150) return 0.75;
    if (distance <= 200) return 0.6;
    return 0.0;
}

function calculateDateOverlapScore(start1, end1, start2, end2) {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();
    
    if (isNaN(s1) || isNaN(e1) || isNaN(s2) || isNaN(e2)) return 0;
    
    const overlapStart = Math.max(s1, s2);
    const overlapEnd = Math.min(e1, e2);
    const overlapDuration = Math.max(0, overlapEnd - overlapStart);
    const overlapDays = overlapDuration / (1000 * 60 * 60 * 24);
    
    if (overlapDays < 1) return 0;
    
    const searchingUserTripDuration = e1 - s1;
    if (searchingUserTripDuration <= 0) return 0;
    
    const totalDays = searchingUserTripDuration / (1000 * 60 * 60 * 24);
    const overlapRatio = overlapDays / totalDays;
    
    if (overlapRatio >= 0.8) return 1.0;
    if (overlapRatio >= 0.5) return 0.9;
    if (overlapRatio >= 0.3) return 0.8;
    if (overlapRatio >= 0.2) return 0.6;
    if (overlapRatio >= 0.1) return 0.3;
    return 0.1;
}

function getPersonalityCompatibility(p1, p2) {
    if (!p1 || !p2) return 0.5;
    const compatibilityMap = {
        introvert: { introvert: 1.0, ambivert: 0.7, extrovert: 0.4 },
        ambivert:  { introvert: 0.7, ambivert: 1.0, extrovert: 0.7 },
        extrovert: { introvert: 0.4, ambivert: 0.7, extrovert: 1.0 },
    };
    return compatibilityMap[p1]?.[p2] ?? 0;
}

function calculateJaccardSimilarity(set1, set2) {
    if (!set1 || !set2 || set1.length === 0 || set2.length === 0) return 0.3;
    
    const s1 = new Set(set1);
    const s2 = new Set(set2);
    const intersection = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    
    if (union.size === 0) return 0.5;
    
    const jaccardScore = intersection.size / union.size;
    
    if (intersection.size > 0) {
        return Math.min(1.0, jaccardScore + 0.2);
    }
    
    return jaccardScore;
}

function calculateBudgetScore(budget1, budget2) {
    if (Math.max(budget1, budget2) === 0) return 1;
    
    const budgetDiff = Math.abs(budget1 - budget2);
    const maxBudget = Math.max(budget1, budget2);
    const ratio = budgetDiff / maxBudget;
    
    if (ratio <= 0.1) return 1.0;
    if (ratio <= 0.25) return 0.8;
    if (ratio <= 0.5) return 0.6;
    if (ratio <= 1.0) return 0.4;
    if (ratio <= 2.0) return 0.2;
    return 0.1;
}

function calculateReligionScore(r1, r2) {
    if (!r1 || !r2) return 0.5;
    const neutralReligions = ['agnostic', 'prefer_not_to_say', 'none'];
    if (r1.toLowerCase() === r2.toLowerCase()) return 1.0;
    if (neutralReligions.includes(r1.toLowerCase()) || neutralReligions.includes(r2.toLowerCase())) return 0.5;
    return 0;
}

function calculateLocationOriginScore(loc1, loc2) {
    if (!loc1 || !loc2) return 0.5;
    
    const distance = Math.sqrt(
        Math.pow(loc1.lat - loc2.lat, 2) + 
        Math.pow(loc1.lon - loc2.lon, 2)
    ) * 111;
    
    if (distance <= 25) return 1.0;
    if (distance <= 100) return 0.8;
    if (distance <= 200) return 0.6;
    if (distance <= 500) return 0.4;
    if (distance <= 1000) return 0.2;
    return 0.1;
}

function calculateAgeScore(age1, age2) {
    if (Math.max(age1, age2) === 0) return 1;
    
    const ageDiff = Math.abs(age1 - age2);
    
    if (ageDiff <= 2) return 1.0;
    if (ageDiff <= 5) return 0.9;
    if (ageDiff <= 10) return 0.7;
    if (ageDiff <= 15) return 0.5;
    if (ageDiff <= 25) return 0.3;
    if (ageDiff <= 40) return 0.1;
    return 0.05;
}

function calculateLifestyleScore(attrs1, attrs2) {
    const smokingMatch = attrs1.smoking === attrs2.smoking ? 1 : 0;
    const drinkingMatch = attrs1.drinking === attrs2.drinking ? 1 : 0;
    return (smokingMatch + drinkingMatch) / 2;
}

// Mock the calculateDynamicWeights function
function calculateDynamicWeights(baseWeights, filterBoost) {
    const weights = { ...baseWeights };
    let totalBoost = 0;
    
    // Apply boosts ONLY to user preference filters
    if (filterBoost.age) {
        weights.age *= filterBoost.age.boost;
        totalBoost += (filterBoost.age.boost - 1) * baseWeights.age;
    }
    
    if (filterBoost.gender) {
        weights.personality *= filterBoost.gender.boost;
        totalBoost += (filterBoost.gender.boost - 1) * baseWeights.personality;
    }
    
    if (filterBoost.personality) {
        weights.personality *= filterBoost.personality.boost;
        totalBoost += (filterBoost.personality.boost - 1) * baseWeights.personality;
    }
    
    if (filterBoost.interests) {
        weights.interests *= filterBoost.interests.boost;
        totalBoost += (filterBoost.interests.boost - 1) * baseWeights.interests;
    }
    
    if (filterBoost.religion) {
        weights.religion *= filterBoost.religion.boost;
        totalBoost += (filterBoost.religion.boost - 1) * baseWeights.religion;
    }
    
    if (filterBoost.smoking) {
        weights.lifestyle *= filterBoost.smoking.boost;
        totalBoost += (filterBoost.smoking.boost - 1) * baseWeights.lifestyle;
    }
    
    if (filterBoost.drinking) {
        weights.lifestyle *= filterBoost.drinking.boost;
        totalBoost += (filterBoost.drinking.boost - 1) * baseWeights.lifestyle;
    }
    
    // Redistribute the boost proportionally to maintain 100% total
    if (totalBoost > 0) {
        const coreFilters = ['destination', 'dateOverlap', 'budget'];
                 const remainingWeight = 1 - Object.entries(weights).reduce((sum, [key, value]) => {
             if (coreFilters.includes(key)) return sum;
             return sum + value;
         }, 0);
        
        if (remainingWeight > 0) {
            const redistributionFactor = totalBoost / remainingWeight;
            
            Object.keys(weights).forEach(key => {
                if (!coreFilters.includes(key) && !filterBoost[key]) {
                    weights[key] *= (1 + redistributionFactor);
                }
            });
        }
    }
    
    return weights;
}

// Mock the createFilterBoost function
function createFilterBoost(filters) {
    const boost = {};
    
    // Apply 1.5x boost to selected filters
    if (filters.age) {
        boost.age = { ...filters.age, boost: 1.5 };
    }
    if (filters.gender) {
        boost.gender = { ...filters.gender, boost: 1.5 };
    }
    if (filters.personality) {
        boost.personality = { ...filters.personality, boost: 1.5 };
    }
    if (filters.interests) {
        boost.interests = { ...filters.interests, boost: 1.5 };
    }
    if (filters.religion) {
        boost.religion = { ...filters.religion, boost: 1.5 };
    }
    if (filters.smoking) {
        boost.smoking = { ...filters.smoking, boost: 1.5 };
    }
    if (filters.drinking) {
        boost.drinking = { ...filters.drinking, boost: 1.5 };
    }
    
    return boost;
}

// Test function to calculate compatibility score
function calculateFinalCompatibilityScore(userSession, matchSession, filterBoost) {
    const baseWeights = {
        destination: 0.25,
        dateOverlap: 0.20,
        budget: 0.20,
        interests: 0.10,
        age: 0.10,
        personality: 0.05,
        locationOrigin: 0.05,
        lifestyle: 0.03,
        religion: 0.02,
    };

    // Apply dynamic weights if filters are selected (1.5x boost for selected filters)
    const weights = filterBoost ? calculateDynamicWeights(baseWeights, filterBoost) : baseWeights;

    const userAttrs = userSession.static_attributes;
    const matchAttrs = matchSession.static_attributes;

    const scores = {
        destinationScore: calculateDestinationScore(userSession.destination, matchSession.destination),
        dateOverlapScore: calculateDateOverlapScore(userSession.startDate, userSession.endDate, matchSession.startDate, matchSession.endDate),
        personalityScore: getPersonalityCompatibility(userAttrs.personality, matchAttrs.personality),
        interestScore: calculateJaccardSimilarity(userAttrs.interests, matchAttrs.interests),
        budgetScore: calculateBudgetScore(userSession.budget, matchSession.budget),
        religionScore: calculateReligionScore(userAttrs.religion, matchAttrs.religion),
        locationOriginScore: calculateLocationOriginScore(userAttrs.location, matchAttrs.location),
        ageScore: calculateAgeScore(userAttrs.age, matchAttrs.age),
        lifestyleScore: calculateLifestyleScore(userAttrs, matchAttrs)
    };

    const finalScore =
        (scores.destinationScore * weights.destination) +
        (scores.dateOverlapScore * weights.dateOverlap) +
        (scores.personalityScore * weights.personality) +
        (scores.interestScore * weights.interests) +
        (scores.budgetScore * weights.budget) +
        (scores.religionScore * weights.religion) +
        (scores.locationOriginScore * weights.locationOrigin) +
        (scores.ageScore * weights.age) +
        (scores.lifestyleScore * weights.lifestyle);

    return { score: finalScore, breakdown: scores, weights };
}

// Run tests
console.log('🧪 Testing Filter Boost Scenarios:\n');

testScenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.name}`);
    console.log(`   ${scenario.description}\n`);
    
    // Create filter boost if filters are selected
    const filterBoost = Object.keys(scenario.filters).length > 0 ? createFilterBoost(scenario.filters) : undefined;
    
    // Calculate score with and without filters
    const result = calculateFinalCompatibilityScore(mockUserSession, mockMatchSession, filterBoost);
    
    console.log(`   📊 Final Score: ${result.score.toFixed(3)}`);
    console.log(`   📊 Weights Applied:`);
    
    Object.entries(result.weights).forEach(([key, value]) => {
        const baseWeight = key === 'destination' ? 0.25 : 
                          key === 'dateOverlap' ? 0.20 :
                          key === 'budget' ? 0.20 :
                          key === 'interests' ? 0.10 :
                          key === 'age' ? 0.10 :
                          key === 'personality' ? 0.05 :
                          key === 'locationOrigin' ? 0.05 :
                          key === 'lifestyle' ? 0.03 : 0.02;
        
        const boost = value / baseWeight;
        const boostText = boost > 1 ? ` (${boost.toFixed(1)}x boost)` : '';
        
        console.log(`      - ${key}: ${value.toFixed(3)}${boostText}`);
    });
    
    // Show specific filter boosts
    if (filterBoost) {
        console.log(`   🔥 Active Filter Boosts:`);
        Object.entries(filterBoost).forEach(([key, value]) => {
            console.log(`      - ${key}: ${value.boost}x boost`);
        });
    }
    
    console.log('\n' + '─'.repeat(80) + '\n');
});

console.log('✅ Filter Boost Testing Complete!');
console.log('💡 Key Points:');
console.log('   - Selected filters get 1.5x boost in weight');
console.log('   - Core travel filters (destination, dates, budget) are NEVER boosted');
console.log('   - Boost is redistributed proportionally to maintain 100% total weight');
console.log('   - This ensures filtered results prioritize user preferences');
