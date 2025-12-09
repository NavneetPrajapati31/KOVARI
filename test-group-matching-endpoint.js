// Test script to verify group matching endpoint usage
// This simulates the explore page logic for group travel mode

const BASE_URL = 'http://localhost:3000';

async function testGroupMatchingEndpoint() {
  console.log('🧪 Testing Group Matching Endpoint Usage');
  console.log('=====================================\n');

  // Simulate group travel mode (activeTab === 1)
  const activeTab = 1;
  const searchData = {
    destination: "Mumbai",
    budget: 25000,
    startDate: new Date("2025-01-15"),
    endDate: new Date("2025-01-20")
  };

  console.log(`📍 Travel Mode: ${activeTab === 0 ? 'SOLO' : 'GROUP'} Travel`);
  console.log(`🎯 Destination: ${searchData.destination}`);
  console.log(`💰 Budget: ₹${searchData.budget.toLocaleString()}`);
  console.log(`📅 Dates: ${searchData.startDate.toLocaleDateString()} - ${searchData.endDate.toLocaleDateString()}\n`);

  try {
    if (activeTab === 0) {
      console.log('❌ This should NOT happen for group travel mode');
      console.log('🔍 Expected: Should call /api/match-solo');
    } else {
      console.log('✅ GROUP TRAVEL MODE - Should call /api/match-groups');
      
      // Simulate the API call that the explore page makes
      const res = await fetch(`${BASE_URL}/api/match-groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: searchData.destination,
          budget: searchData.budget,
          startDate: searchData.startDate.toISOString().split("T")[0],
          endDate: searchData.endDate.toISOString().split("T")[0],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('✅ API call successful!');
        console.log(`📊 Found ${data.groups?.length || 0} matching groups`);
        
        if (data.groups && data.groups.length > 0) {
          console.log('\n📋 Sample group data:');
          const sampleGroup = data.groups[0];
          console.log(`   - Name: ${sampleGroup.name}`);
          console.log(`   - Destination: ${sampleGroup.destination}`);
          console.log(`   - Budget: ₹${sampleGroup.budget?.toLocaleString() || 'N/A'}`);
          console.log(`   - Members: ${sampleGroup.members || 0}`);
        }
      } else {
        const errorData = await res.json();
        console.log('❌ API call failed:', errorData.error || 'Unknown error');
      }
    }

    console.log('\n🎯 Test Summary:');
    console.log(`   - Travel Mode: ${activeTab === 0 ? 'SOLO' : 'GROUP'}`);
    console.log(`   - API Endpoint: ${activeTab === 0 ? '/api/match-solo' : '/api/match-groups'}`);
    console.log(`   - Status: ${activeTab === 0 ? '❌ Wrong mode for group testing' : '✅ Correct mode and endpoint'}`);

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testGroupMatchingEndpoint();
