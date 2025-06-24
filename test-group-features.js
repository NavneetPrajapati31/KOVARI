// Test script for new group features
// Run this in your browser console after logging into your app

const BASE_URL = "http://localhost:3000";

// Helper function to get a real group ID from the current page or API
async function getRealGroupId() {
  // Try to get group ID from URL if on a group page
  const urlParams = new URLSearchParams(window.location.search);
  const pathSegments = window.location.pathname.split("/");

  // Check if we're on a group page
  if (pathSegments.includes("groups") && pathSegments.length > 2) {
    const groupIndex = pathSegments.indexOf("groups");
    if (pathSegments[groupIndex + 1]) {
      return pathSegments[groupIndex + 1];
    }
  }

  // If not on a group page, try to fetch groups from API
  try {
    const response = await fetch(`${BASE_URL}/api/groups`, {
      credentials: "include",
    });

    if (response.ok) {
      const groups = await response.json();
      if (groups && groups.length > 0) {
        return groups[0].id;
      }
    }
  } catch (error) {
    console.error("Error fetching groups:", error);
  }

  // Fallback: prompt user for group ID
  const groupId = prompt("Please enter a group ID to test with:");
  if (groupId) {
    return groupId;
  }

  throw new Error("No group ID available for testing");
}

// Test 1: Join Request for Public Group
async function testJoinRequest() {
  console.log("Testing join request functionality...");

  try {
    const groupId = await getRealGroupId();
    console.log(`Using group ID: ${groupId}`);

    const response = await fetch(
      `${BASE_URL}/api/groups/${groupId}/join-request`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    const result = await response.text();
    console.log("Join request response:", response.status, result);

    if (response.ok) {
      console.log("✅ Join request successful");
    } else {
      console.log("❌ Join request failed:", result);
    }
  } catch (error) {
    console.error("❌ Join request error:", error);
  }
}

// Test 2: Direct Join for Public Group
async function testDirectJoin() {
  console.log("Testing direct join functionality...");

  try {
    const groupId = await getRealGroupId();
    console.log(`Using group ID: ${groupId}`);

    const response = await fetch(`${BASE_URL}/api/groups/${groupId}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const result = await response.text();
    console.log("Direct join response:", response.status, result);

    if (response.ok) {
      console.log("✅ Direct join successful");
    } else {
      console.log("❌ Direct join failed:", result);
    }
  } catch (error) {
    console.error("❌ Direct join error:", error);
  }
}

// Test 3: Accept Invitation with Member Limit
async function testAcceptInvitation() {
  console.log("Testing invitation acceptance with member limit...");

  try {
    const groupId = await getRealGroupId();
    console.log(`Using group ID: ${groupId}`);

    const response = await fetch(`${BASE_URL}/api/group-invitation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        groupId: groupId,
        action: "accept",
      }),
      credentials: "include",
    });

    const result = await response.text();
    console.log("Accept invitation response:", response.status, result);

    if (response.ok) {
      console.log("✅ Invitation accepted successfully");
    } else {
      console.log("❌ Invitation acceptance failed:", result);
    }
  } catch (error) {
    console.error("❌ Accept invitation error:", error);
  }
}

// Test 4: Check Database Status
async function checkDatabaseStatus() {
  console.log("Checking database status...");

  try {
    const groupId = await getRealGroupId();
    console.log(`Using group ID: ${groupId}`);

    const response = await fetch(`${BASE_URL}/api/groups/${groupId}/members`, {
      credentials: "include",
    });

    const result = await response.json();
    console.log("Group members:", result);

    if (result.members && result.members.length >= 10) {
      console.log(
        "⚠️  Group has 10+ members - member limit should be enforced"
      );
    } else {
      console.log("✅ Group has less than 10 members");
    }
  } catch (error) {
    console.error("❌ Database check error:", error);
  }
}

// Test 5: Test UI Integration
async function testUIIntegration() {
  console.log("Testing UI integration...");

  // Check if we're on the explore page
  if (window.location.pathname.includes("/explore")) {
    console.log("✅ On explore page - UI should show join/request buttons");

    // Look for group cards
    const groupCards = document.querySelectorAll("[data-group-id]");
    if (groupCards.length > 0) {
      console.log(`✅ Found ${groupCards.length} group cards`);

      // Check button states
      const buttons = document.querySelectorAll("button");
      const joinButtons = Array.from(buttons).filter(
        (btn) =>
          btn.textContent?.includes("Join") ||
          btn.textContent?.includes("Request")
      );

      console.log(`✅ Found ${joinButtons.length} join/request buttons`);
    } else {
      console.log(
        "⚠️  No group cards found - make sure you have groups to test with"
      );
    }
  } else {
    console.log(
      "⚠️  Not on explore page - navigate to /explore?tab=groups to test UI"
    );
  }
}

// Run all tests
async function runAllTests() {
  console.log("🧪 Starting group feature tests...\n");

  await testJoinRequest();
  console.log("");

  await testDirectJoin();
  console.log("");

  await testAcceptInvitation();
  console.log("");

  await checkDatabaseStatus();
  console.log("");

  await testUIIntegration();
  console.log("");

  console.log("🏁 Tests completed!");
  console.log("\n📝 Next steps:");
  console.log("1. Check the explore page at /explore?tab=groups");
  console.log("2. Try clicking join/request buttons on group cards");
  console.log("3. Check your database for new membership records");
  console.log(
    "4. Test with a group that has 10 members to verify limit enforcement"
  );
}

// Export for use in browser console
if (typeof window !== "undefined") {
  window.testGroupFeatures = {
    testJoinRequest,
    testDirectJoin,
    testAcceptInvitation,
    checkDatabaseStatus,
    testUIIntegration,
    runAllTests,
    getRealGroupId,
  };
  console.log("Test functions available as window.testGroupFeatures");
  console.log("Run: testGroupFeatures.runAllTests() to start testing");
}

// Run tests if this is a Node.js script
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    testJoinRequest,
    testDirectJoin,
    testAcceptInvitation,
    checkDatabaseStatus,
    testUIIntegration,
    runAllTests,
    getRealGroupId,
  };
}
