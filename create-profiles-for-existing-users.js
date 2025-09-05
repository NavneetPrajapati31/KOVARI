#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🗄️ Creating Profiles for Existing Users\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logUser(message) {
  log(`👤 ${message}`, 'cyan');
}

function logDb(message) {
  log(`🗄️  ${message}`, 'magenta');
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logError('Missing Supabase environment variables:');
  logError('  - NEXT_PUBLIC_SUPABASE_URL');
  logError('  - SUPABASE_SERVICE_ROLE_KEY');
  logError('\nPlease check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Existing users data from your database
const existingUsers = [
  {"idx":6,"id":"0503a5d3-78b9-4285-bebf-7796fd31f368","clerk_user_id":"user_2yjEnOfpwIeQxWnR9fEvS7sRUrX","created_at":"2025-06-19 13:29:13.348409+00"},
  {"idx":7,"id":"097584f4-8bfa-4734-a377-c3e504d5d88a","clerk_user_id":"user_2zbc1xn77B33qPtvPN8stMmLlBk","created_at":"2025-07-08 19:30:23.303477+00"},
  {"idx":8,"id":"09dd11a3-f0b6-42d2-ad29-e60d8f500fc3","clerk_user_id":"clerk_david","created_at":"2025-06-27 20:52:01+00"},
  {"idx":9,"id":"0e0e9861-bf3a-4134-92b1-41e5c3b2fa0a","clerk_user_id":"clerk_emma_202","created_at":"2025-08-29 22:36:28.943752+00"},
  {"idx":10,"id":"1385537b-1a48-4a83-a854-35e193c11242","clerk_user_id":"user_test_2","created_at":"2025-06-19 09:40:38.488656+00"},
  {"idx":11,"id":"151156d5-c8d4-4c9c-b7fe-ea06b720b832","clerk_user_id":"user_test_11","created_at":"2025-06-19 09:40:38.488656+00"},
  {"idx":12,"id":"1a645e66-4e30-431c-a622-cc16da8092fa","clerk_user_id":"user_31ynPq2hrb4Lb2JMh3dCGztQwZS","created_at":"2025-08-29 22:07:08.89641+00"},
  {"idx":13,"id":"20987c1f-1604-4f23-a006-532f2dd7adf8","clerk_user_id":"user_test_27","created_at":"2025-06-19 09:40:38.488656+00"},
  {"idx":14,"id":"23422315-5d45-4c46-bdb4-65a5c3e54036","clerk_user_id":"user_31vbl9JLYP70bpZjHi7XrJyVmIO","created_at":"2025-08-28 19:01:12.443037+00"},
  {"idx":15,"id":"28eed97d-de47-46dc-813d-c8c02ae451ad","clerk_user_id":"user_31ymSZhwk02XzhzeV3T1IVFzbZQ","created_at":"2025-08-29 21:58:25.233458+00"},
  {"idx":16,"id":"2cc00ebf-e2e8-4a55-b6f2-56bedc1913e6","clerk_user_id":"user_31vY944Ca5al447D6tMUNozWYll","created_at":"2025-08-28 18:31:08.619348+00"},
  {"idx":17,"id":"2d20a29e-4454-4736-bae8-9b2b8c1f4ac1","clerk_user_id":"user_31va6riZ0UszU9ErI1e9iCxJHVa","created_at":"2025-08-28 18:47:11.732818+00"},
  {"idx":18,"id":"389ad5ad-b8c1-494c-ad26-a2aed8a6f981","clerk_user_id":"user_test_6","created_at":"2025-06-19 09:40:38.488656+00"},
  {"idx":19,"id":"3f1321dc-185a-44c0-bedc-45903739b296","clerk_user_id":"user_test_8","created_at":"2025-06-19 09:40:38.488656+00"},
  {"idx":20,"id":"40b15146-3d61-4d4b-9bf0-edd1f5293796","clerk_user_id":"user_2zpivewBZqNRVllheEcTlcHYrgA","created_at":"2025-07-13 19:24:09.444512+00"},
  {"idx":21,"id":"4113f5a6-0a8c-4d02-b3b0-ed7f7f1c2f5e","clerk_user_id":"user_2zpjWEoPUPbAc9gHvqldn8VLxCK","created_at":"2025-07-13 19:29:00.617026+00"},
  {"idx":22,"id":"45ea8576-42fc-4f0c-b8d2-afcb348f6886","clerk_user_id":"WVnMGcpwL6ezA9wQomMGpjuffjF3","created_at":"2025-08-24 07:52:41.573268+00"},
  {"idx":23,"id":"4a3ba0a2-0b55-4542-b776-69623c44b6a1","clerk_user_id":"user_31vbC7i2rRVfNSHhdCSWfKjOFKr","created_at":"2025-08-28 18:56:37.10657+00"},
  {"idx":24,"id":"4c5c6e30-7bad-44f1-ab50-92c01b5e1a2c","clerk_user_id":"user_31yj1QG6K9XhgnyH9LedFyvkJGh","created_at":"2025-08-29 21:30:40.350353+00"},
  {"idx":25,"id":"4f759a80-0c23-4430-8443-53a0807efa28","clerk_user_id":"user_2zghYyxAutjzjAGehuA2xjI1XxQ","created_at":"2025-07-10 14:44:38.878227+00"},
  {"idx":26,"id":"500f95f8-ceb5-428a-8039-61ceac856628","clerk_user_id":"user_test_19","created_at":"2025-06-19 09:40:38.488656+00"},
  {"idx":27,"id":"50748cd6-d20c-4844-8d0b-367566cae1ec","clerk_user_id":"user_test_23","created_at":"2025-06-19 09:40:38.488656+00"},
  {"idx":28,"id":"51b530f6-707d-4bf9-92b4-fd0fbd511041","clerk_user_id":"user_test_28","created_at":"2025-06-19 09:40:38.488656+00"},
  {"idx":29,"id":"550e8400-e29b-41d4-a716-446655440001","clerk_user_id":"clerk_user_john_001","created_at":"2025-07-09 11:40:35.273461+00"},
  {"idx":30,"id":"550e8400-e29b-41d4-a716-446655440002","clerk_user_id":"clerk_user_sarah_002","created_at":"2025-07-14 11:40:35.273461+00"},
  {"idx":31,"id":"550e8400-e29b-41d4-a716-446655440003","clerk_user_id":"clerk_user_mike_003","created_at":"2025-07-19 11:40:35.273461+00"},
  {"idx":32,"id":"550e8400-e29b-41d4-a716-446655440004","clerk_user_id":"clerk_user_emma_004","created_at":"2025-07-24 11:40:35.273461+00"},
  {"idx":33,"id":"550e8400-e29b-41d4-a716-446655440005","clerk_user_id":"clerk_user_alex_005","created_at":"2025-07-29 11:40:35.273461+00"},
  {"idx":34,"id":"550e8400-e29b-41d4-a716-446655440006","clerk_user_id":"clerk_user_lisa_006","created_at":"2025-08-03 11:40:35.273461+00"},
  {"idx":35,"id":"550e8400-e29b-41d4-a716-446655440007","clerk_user_id":"clerk_user_david_007","created_at":"2025-08-05 11:40:35.273461+00"},
  {"idx":36,"id":"550e8400-e29b-41d4-a716-446655440008","clerk_user_id":"clerk_user_maria_008","created_at":"2025-08-07 11:40:35.273461+00"},
  {"idx":37,"id":"56b6b81e-89ca-4282-8606-e72c5dc9c80f","clerk_user_id":"user_31yhkxhWiei6HcQ8fcljfbrrU6L","created_at":"2025-08-29 21:20:07.585907+00"},
  {"idx":38,"id":"5bb261f0-641b-416a-b0f1-36446bee58ba","clerk_user_id":"user_30eTq6GtNkewt0zYsqoREtauchF","created_at":"2025-07-31 18:40:53.892088+00"}
];

// Generate profile data for each user
function generateProfileData(user, index) {
  const names = [
    'Alice Sharma', 'Bob Kumar', 'Carol Fernandes', 'David Patel', 'Emma Singh',
    'Frank Iyer', 'Grace Khan', 'Henry Das', 'Ishaan Mehta', 'Jaya Reddy',
    'Karan Malhotra', 'Lakshmi Devi', 'Mohan Gupta', 'Neha Kapoor', 'Om Prakash',
    'Priya Singh', 'Rahul Verma', 'Sita Patel', 'Tarun Kumar', 'Uma Devi',
    'Vikram Singh', 'Wendy Chen', 'Xavier Rodriguez', 'Yuki Tanaka', 'Zara Ahmed',
    'Aarav Patel', 'Bhavya Reddy', 'Chirag Malhotra', 'Divya Sharma', 'Esha Gupta',
    'Farhan Khan', 'Gauri Singh', 'Harsh Verma', 'Ira Patel', 'Jai Kumar'
  ];
  
  const cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad',
    'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
    'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana',
    'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar',
    'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Allahabad'
  ];
  
  const jobs = [
    'software_engineer', 'designer', 'teacher', 'marketing_manager', 'yoga_instructor',
    'musician', 'food_blogger', 'writer', 'doctor', 'lawyer', 'architect', 'chef',
    'photographer', 'artist', 'consultant', 'entrepreneur', 'researcher', 'journalist',
    'translator', 'interpreter', 'tour_guide', 'fitness_trainer', 'counselor',
    'librarian', 'librarian', 'accountant', 'sales_manager', 'hr_manager'
  ];
  
  const personalities = ['extrovert', 'ambivert', 'introvert'];
  const genders = ['male', 'female'];
  const religions = ['hindu', 'muslim', 'christian', 'sikh', 'buddhist', 'jain', 'agnostic'];
  const foodPreferences = ['veg', 'non_veg'];
  const smokingHabits = ['No', 'Yes'];
  const drinkingHabits = ['No', 'Socially', 'Regularly'];
  
  const name = names[index % names.length];
  const username = name.toLowerCase().replace(' ', '_') + '_' + (index + 1);
  const age = 20 + (index % 40); // Ages 20-59
  const gender = genders[index % genders.length];
  const personality = personalities[index % personalities.length];
  const city = cities[index % cities.length];
  const job = jobs[index % jobs.length];
  const religion = religions[index % religions.length];
  const foodPref = foodPreferences[index % foodPreferences.length];
  const smoking = smokingHabits[index % smokingHabits.length];
  const drinking = drinkingHabits[index % drinkingHabits.length];
  
  // Generate languages based on region
  const languages = ['english'];
  if (['Mumbai', 'Pune', 'Nagpur'].includes(city)) languages.push('hindi', 'marathi');
  else if (['Delhi', 'Lucknow', 'Kanpur'].includes(city)) languages.push('hindi', 'punjabi');
  else if (['Bangalore', 'Mysore'].includes(city)) languages.push('hindi', 'kannada');
  else if (['Chennai', 'Madurai'].includes(city)) languages.push('hindi', 'tamil');
  else if (['Hyderabad'].includes(city)) languages.push('hindi', 'telugu');
  else if (['Kolkata'].includes(city)) languages.push('hindi', 'bengali');
  else languages.push('hindi');
  
  return {
    user_id: user.id,
    username: username,
    name: name,
    age: age,
    gender: gender,
    personality: personality,
    smoking: smoking,
    drinking: drinking,
    religion: religion,
    food_prefrence: foodPref,
    nationality: 'indian',
    job: job,
    languages: languages,
    location: city,
    profile_photo: `https://images.unsplash.com/photo-${1500000000000 + index}?w=150&h=150&fit=crop&crop=face`,
    bio: `${name} is a ${age}-year-old ${personality} ${job} from ${city}. Loves traveling and meeting new people!`,
    number: `+91987654${String(index + 1000).padStart(4, '0')}`,
    email: `${username}@example.com`,
    birthday: `${2000 - age}-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 28) + 1).padStart(2, '0')}`,
    verified: true
  };
}

// Create profiles for existing users
async function createProfilesForExistingUsers() {
  try {
    logInfo('Connecting to Supabase...');
    
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      logError('Failed to connect to Supabase:');
      logError(testError.message);
      return;
    }
    
    logSuccess('Connected to Supabase successfully!');
    
    console.log('\n' + '='.repeat(80));
    logDb('CREATING PROFILES FOR EXISTING USERS');
    console.log('='.repeat(80));
    
    logInfo(`Found ${existingUsers.length} existing users to create profiles for`);
    
    // Check which users already have profiles
    logInfo('Checking existing profiles...');
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, username')
      .in('user_id', existingUsers.map(u => u.id));
    
    if (profilesError) {
      logWarning('Could not check existing profiles:');
      logWarning(profilesError.message);
    } else {
      const existingProfileUserIds = existingProfiles?.map(p => p.user_id) || [];
      const usersNeedingProfiles = existingUsers.filter(u => !existingProfileUserIds.includes(u.id));
      logInfo(`${existingProfileUserIds.length} users already have profiles`);
      logInfo(`${usersNeedingProfiles.length} users need profiles created`);
      
      if (usersNeedingProfiles.length === 0) {
        logSuccess('All users already have profiles!');
        return;
      }
      
      // Create profiles for users who don't have them
      logInfo('Creating profiles for users without profiles...');
      
      for (let i = 0; i < usersNeedingProfiles.length; i++) {
        const user = usersNeedingProfiles[i];
        const profileData = generateProfileData(user, i);
        
        try {
          const { data: newProfile, error: profileError } = await supabase
            .from('profiles')
            .insert(profileData)
            .select()
            .single();
          
          if (profileError) {
            logError(`Failed to create profile for ${profileData.name}:`);
            logError(profileError.message);
            continue;
          }
          
          logUser(`✅ Created profile: ${profileData.name} (@${profileData.username})`);
          logDb(`    📍 ${profileData.location}, ${profileData.age}yo ${profileData.gender}`);
          logDb(`    💼 ${profileData.job}, ${profileData.personality}`);
          logDb(`    🍽️  ${profileData.food_prefrence}, ${profileData.smoking}, ${profileData.drinking}`);
          
        } catch (error) {
          logError(`Unexpected error creating profile for ${profileData.name}:`);
          logError(error.message);
        }
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(80));
    logSuccess('PROFILE CREATION COMPLETED');
    console.log('='.repeat(80));
    
    logInfo('Profiles created with the following attributes:');
    logInfo('• Age, gender, personality, smoking, drinking preferences');
    logInfo('• Religion, food preferences, nationality, job');
    logInfo('• Languages, location, profile photos, bio');
    logInfo('• Contact information (phone, email)');
    
    console.log('\n📊 Summary:');
    console.log(`• Total users: ${existingUsers.length}`);
    console.log(`• Profiles created: ${existingUsers.length}`);
    console.log(`• Ready for Redis session testing!`);
    
    console.log('\n🎯 These users are now ready for algorithm testing!');
    console.log('💡 Run: npm run test-algorithm to test the full flow');
    
  } catch (error) {
    logError('Failed to create profiles:');
    logError(error.message);
    logError('Full error:');
    logError(JSON.stringify(error, null, 2));
  }
}

// Run the script
if (require.main === module) {
  createProfilesForExistingUsers().catch(error => {
    logError('Unexpected error:');
    logError(error.message);
    process.exit(1);
  });
}

module.exports = { createProfilesForExistingUsers, existingUsers };
