// Test script to verify API endpoint selection based on activeTab
// This simulates the search logic from the explore page

console.log("🧪 Testing API endpoint selection based on activeTab...\n");

// Simulate the search function logic exactly as in the explore page
function testSearchEndpoint(activeTab, localActiveTab, searchData) {
  console.log(`🔍 Testing with activeTab: ${activeTab}, localActiveTab: ${localActiveTab}`);
  console.log(`📍 Search Data:`, searchData);
  
  // Use the most reliable tab state - the one that was set when tab was clicked
  const isGroupSearch = localActiveTab === 1;
  
  console.log(`🎯 isGroupSearch: ${isGroupSearch}`);
  
  let endpoint = "";
  let searchMode = "";
  let apiCall = "";
  
  if (localActiveTab === 0) {
    // SOLO TRAVEL MODE - Only search for solo travelers
    endpoint = "/api/match-solo";
    searchMode = "SOLO";
    apiCall = `POST /api/match-solo?userId=${searchData.userId || 'user123'}`;
  } else if (localActiveTab === 1) {
    // GROUP TRAVEL MODE - Only search for groups
    endpoint = "/api/match-groups";
    searchMode = "GROUP";
    apiCall = `POST /api/match-groups`;
  }
  
  console.log(`🎯 Selected Endpoint: ${endpoint}`);
  console.log(`🚀 Search Mode: ${searchMode}`);
  console.log(`📡 API Call: ${apiCall}`);
  
  return { endpoint, searchMode, apiCall };
}

// Test cases
console.log("=== TEST CASE 1: Solo Travel (activeTab = 0, localActiveTab = 0) ===");
testSearchEndpoint(0, 0, { destination: "Paris", budget: 20000, userId: "user123" });

console.log("\n=== TEST CASE 2: Group Travel (activeTab = 1, localActiveTab = 1) ===");
testSearchEndpoint(1, 1, { destination: "Sydney", budget: 30000, userId: "user123" });

console.log("\n=== TEST CASE 3: Mismatched Tabs (activeTab = 0, localActiveTab = 1) ===");
testSearchEndpoint(0, 1, { destination: "Tokyo", budget: 40000, userId: "user123" });

console.log("\n=== TEST CASE 4: Mismatched Tabs (activeTab = 1, localActiveTab = 0) ===");
testSearchEndpoint(1, 0, { destination: "London", budget: 25000, userId: "user123" });

console.log("\n✅ Test completed!");
console.log("\n📋 Key Points:");
console.log("- localActiveTab determines the search mode, NOT activeTab");
console.log("- localActiveTab === 0 → /api/match-solo (SOLO mode)");
console.log("- localActiveTab === 1 → /api/match-groups (GROUP mode)");
console.log("- The search function uses localActiveTab for logic, not activeTab");
