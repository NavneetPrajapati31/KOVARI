const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseSoloData() {
    console.log('🔍 Testing Supabase Solo Matching Data\n');
    console.log('=====================================\n');

    // Test 1: Check if we can connect to Supabase
    console.log('1. Testing Supabase Connection...');
    try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (error) {
            console.log('❌ Supabase connection failed:', error.message);
            return;
        }
        console.log('✅ Supabase connection successful');
    } catch (error) {
        console.log('❌ Supabase connection error:', error.message);
        return;
    }

    // Test 2: Check profiles table
    console.log('\n2. Testing Profiles Table...');
    try {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, name, username, age, gender, user_id, created_at')
            .limit(5);

        if (error) {
            console.log('❌ Profiles fetch error:', error.message);
        } else {
            console.log(`✅ Found ${profiles?.length || 0} profiles`);
            if (profiles && profiles.length > 0) {
                console.log('Sample profile:', {
                    id: profiles[0].id,
                    name: profiles[0].name,
                    username: profiles[0].username,
                    age: profiles[0].age,
                    gender: profiles[0].gender,
                    user_id: profiles[0].user_id
                });
            }
        }
    } catch (error) {
        console.log('❌ Profiles test error:', error.message);
    }

    // Test 3: Check travel_preferences table
    console.log('\n3. Testing Travel Preferences Table...');
    try {
        const { data: travelPrefs, error } = await supabase
            .from('travel_preferences')
            .select('user_id, destinations, start_date, end_date, interests')
            .limit(5);

        if (error) {
            console.log('❌ Travel preferences fetch error:', error.message);
        } else {
            console.log(`✅ Found ${travelPrefs?.length || 0} travel preferences`);
            if (travelPrefs && travelPrefs.length > 0) {
                console.log('Sample travel preference:', {
                    user_id: travelPrefs[0].user_id,
                    destinations: travelPrefs[0].destinations,
                    start_date: travelPrefs[0].start_date,
                    end_date: travelPrefs[0].end_date,
                    interests: travelPrefs[0].interests
                });
            }
        }
    } catch (error) {
        console.log('❌ Travel preferences test error:', error.message);
    }

    // Test 4: Check users table (for Clerk integration)
    console.log('\n4. Testing Users Table (Clerk Integration)...');
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, clerk_user_id, created_at')
            .limit(5);

        if (error) {
            console.log('❌ Users fetch error:', error.message);
        } else {
            console.log(`✅ Found ${users?.length || 0} users`);
            if (users && users.length > 0) {
                console.log('Sample user:', {
                    id: users[0].id,
                    clerk_user_id: users[0].clerk_user_id,
                    created_at: users[0].created_at
                });
            }
        }
    } catch (error) {
        console.log('❌ Users test error:', error.message);
    }

    // Test 5: Check user_follows table
    console.log('\n5. Testing User Follows Table...');
    try {
        const { data: follows, error } = await supabase
            .from('user_follows')
            .select('follower_id, following_id, created_at')
            .limit(5);

        if (error) {
            console.log('❌ User follows fetch error:', error.message);
        } else {
            console.log(`✅ Found ${follows?.length || 0} follow relationships`);
            if (follows && follows.length > 0) {
                console.log('Sample follow relationship:', {
                    follower_id: follows[0].follower_id,
                    following_id: follows[0].following_id,
                    created_at: follows[0].created_at
                });
            }
        }
    } catch (error) {
        console.log('❌ User follows test error:', error.message);
    }

    // Test 6: Test the complete solo travelers query (like in fetchExploreData.ts)
    console.log('\n6. Testing Complete Solo Travelers Query...');
    try {
        // First get a sample user_id to exclude
        const { data: sampleProfile } = await supabase
            .from('profiles')
            .select('user_id')
            .limit(1);

        const currentUserId = sampleProfile?.[0]?.user_id || 'test-user-id';

        let query = supabase
            .from("profiles")
            .select(`
                id,
                name,
                username,
                age,
                bio,
                profile_photo,
                user_id,
                gender,
                created_at,
                users (
                    clerk_user_id
                )
            `)
            .not("created_at", "is", null)
            .order("created_at", { ascending: false })
            .limit(10);

        const { data: profiles, error: profilesError } = await query;

        if (profilesError) {
            console.log('❌ Profiles query error:', profilesError.message);
        } else {
            console.log(`✅ Found ${profiles?.length || 0} profiles in solo travelers query`);
            
            if (profiles && profiles.length > 0) {
                // Filter out current user
                const filteredProfiles = profiles.filter(profile => profile.user_id !== currentUserId);
                console.log(`After filtering current user: ${filteredProfiles.length} profiles`);

                if (filteredProfiles.length > 0) {
                    // Get user IDs for travel preferences
                    const userIds = filteredProfiles.map(p => p.user_id);
                    
                    // Fetch travel preferences
                    const { data: travelPrefs, error: prefsError } = await supabase
                        .from("travel_preferences")
                        .select("user_id, destinations, start_date, end_date, interests")
                        .in("user_id", userIds);

                    if (prefsError) {
                        console.log('❌ Travel preferences fetch error:', prefsError.message);
                    } else {
                        console.log(`✅ Found ${travelPrefs?.length || 0} travel preferences for these users`);
                        
                        if (travelPrefs && travelPrefs.length > 0) {
                            console.log('Sample travel preference data:', {
                                user_id: travelPrefs[0].user_id,
                                destinations: travelPrefs[0].destinations,
                                interests: travelPrefs[0].interests
                            });
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.log('❌ Complete query test error:', error.message);
    }

    // Test 7: Check table schemas
    console.log('\n7. Checking Table Schemas...');
    const tables = ['profiles', 'travel_preferences', 'users', 'user_follows'];
    
    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(0);
            
            if (error) {
                console.log(`❌ ${table} table error:`, error.message);
            } else {
                console.log(`✅ ${table} table accessible`);
            }
        } catch (error) {
            console.log(`❌ ${table} table test error:`, error.message);
        }
    }

    console.log('\n=====================================');
    console.log('🎯 Supabase Solo Data Test Complete!');
    console.log('\nSummary:');
    console.log('- Supabase connection: Working');
    console.log('- Tables accessible: Check above results');
    console.log('- Data availability: Check above results');
    console.log('\nNext steps:');
    console.log('1. Insert test user data if tables are empty');
    console.log('2. Verify Clerk user integration');
    console.log('3. Test with real user sessions');
}

// Run the test
testSupabaseSoloData().catch(console.error);
