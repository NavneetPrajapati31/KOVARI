// Test script for verifying deleted users and removed members in group chat
// Run this in your browser console after logging into your app

const BASE_URL = "http://localhost:3000";

// Helper function to get a real group ID from the current page or API
async function getRealGroupId() {
  // Try to get group ID from URL if on a group page
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

// Test 1: Check if messages from deleted users are visible
async function testDeletedUserMessages() {
  console.log("Testing deleted user messages visibility...");

  try {
    const groupId = await getRealGroupId();
    console.log(`Using group ID: ${groupId}`);

    const response = await fetch(`${BASE_URL}/api/groups/${groupId}/messages`, {
      credentials: "include",
    });

    if (!response.ok) {
      console.log("❌ Failed to fetch messages:", response.status);
      return;
    }

    const messages = await response.json();
    console.log("Fetched messages:", messages);

    // Check for messages from deleted users
    const deletedUserMessages = messages.filter(
      (msg) => msg.sender === "Deleted User"
    );

    if (deletedUserMessages.length > 0) {
      console.log(
        "✅ Found messages from deleted users:",
        deletedUserMessages.length
      );
      deletedUserMessages.forEach((msg) => {
        console.log(
          `  - Message ID: ${msg.id}, Content: ${msg.content}, Timestamp: ${msg.timestamp}`
        );
      });
    } else {
      console.log(
        "ℹ️  No messages from deleted users found (this is normal if no users have been deleted)"
      );
    }

    // Check for messages from unknown users (should be rare)
    const unknownUserMessages = messages.filter(
      (msg) => msg.sender === "Unknown User"
    );

    if (unknownUserMessages.length > 0) {
      console.log(
        "⚠️  Found messages from unknown users:",
        unknownUserMessages.length
      );
      unknownUserMessages.forEach((msg) => {
        console.log(
          `  - Message ID: ${msg.id}, Content: ${msg.content}, Timestamp: ${msg.timestamp}`
        );
      });
    }

    console.log(`✅ Total messages in chat: ${messages.length}`);
    console.log(
      `✅ Messages from deleted users: ${deletedUserMessages.length}`
    );
    console.log(
      `✅ Messages from unknown users: ${unknownUserMessages.length}`
    );
  } catch (error) {
    console.error("❌ Error testing deleted user messages:", error);
  }
}

// Test 2: Check if group members API handles deleted users
async function testDeletedUserMembers() {
  console.log("Testing deleted user members visibility...");

  try {
    const groupId = await getRealGroupId();
    console.log(`Using group ID: ${groupId}`);

    const response = await fetch(`${BASE_URL}/api/groups/${groupId}/members`, {
      credentials: "include",
    });

    if (!response.ok) {
      console.log("❌ Failed to fetch members:", response.status);
      return;
    }

    const data = await response.json();
    const members = data.members || [];
    console.log("Fetched members:", members);

    // Check for deleted users in members list
    const deletedUserMembers = members.filter(
      (member) => member.name === "Deleted User"
    );

    if (deletedUserMembers.length > 0) {
      console.log(
        "✅ Found deleted users in members list:",
        deletedUserMembers.length
      );
      deletedUserMembers.forEach((member) => {
        console.log(
          `  - Member ID: ${member.id}, Role: ${member.role}, Joined: ${member.joined_at}`
        );
      });
    } else {
      console.log(
        "ℹ️  No deleted users found in members list (this is normal if no users have been deleted)"
      );
    }

    console.log(`✅ Total members in group: ${members.length}`);
    console.log(`✅ Deleted users in group: ${deletedUserMembers.length}`);
  } catch (error) {
    console.error("❌ Error testing deleted user members:", error);
  }
}

// Test 3: Verify that messages are still visible even if sender is removed from group
async function testRemovedUserMessages() {
  console.log("Testing removed user messages visibility...");

  try {
    const groupId = await getRealGroupId();
    console.log(`Using group ID: ${groupId}`);

    // First, get all messages
    const messagesResponse = await fetch(
      `${BASE_URL}/api/groups/${groupId}/messages`,
      {
        credentials: "include",
      }
    );

    if (!messagesResponse.ok) {
      console.log("❌ Failed to fetch messages:", messagesResponse.status);
      return;
    }

    const messages = await messagesResponse.json();

    // Then, get current members
    const membersResponse = await fetch(
      `${BASE_URL}/api/groups/${groupId}/members`,
      {
        credentials: "include",
      }
    );

    if (!membersResponse.ok) {
      console.log("❌ Failed to fetch members:", membersResponse.status);
      return;
    }

    const membersData = await membersResponse.json();
    const currentMembers = membersData.members || [];
    const currentMemberIds = currentMembers.map((m) => m.id);

    // Find messages from users who are no longer in the group
    const messagesFromRemovedUsers = messages.filter((msg) => {
      // Check if the message sender is not in the current members list
      return !currentMemberIds.includes(msg.user_id);
    });

    if (messagesFromRemovedUsers.length > 0) {
      console.log(
        "✅ Found messages from removed users:",
        messagesFromRemovedUsers.length
      );
      messagesFromRemovedUsers.forEach((msg) => {
        console.log(
          `  - Message ID: ${msg.id}, Sender: ${msg.sender}, Content: ${msg.content}, Timestamp: ${msg.timestamp}`
        );
      });
    } else {
      console.log(
        "ℹ️  No messages from removed users found (this is normal if no users have been removed)"
      );
    }

    console.log(`✅ Total messages: ${messages.length}`);
    console.log(`✅ Current members: ${currentMembers.length}`);
    console.log(
      `✅ Messages from removed users: ${messagesFromRemovedUsers.length}`
    );
  } catch (error) {
    console.error("❌ Error testing removed user messages:", error);
  }
}

// Test 4: Check real-time message handling
async function testRealtimeMessageHandling() {
  console.log("Testing real-time message handling for deleted users...");

  try {
    const groupId = await getRealGroupId();
    console.log(`Using group ID: ${groupId}`);

    // Navigate to the chat page to test real-time functionality
    const chatUrl = `${BASE_URL}/groups/${groupId}/chat`;

    if (window.location.href !== chatUrl) {
      console.log(
        `ℹ️  Navigate to ${chatUrl} to test real-time message handling`
      );
      console.log(
        "ℹ️  Then run this test again to verify real-time functionality"
      );
      return;
    }

    console.log("✅ On chat page - real-time functionality should be active");
    console.log("ℹ️  Send a message to test real-time handling");
    console.log("ℹ️  Check browser console for real-time message logs");
  } catch (error) {
    console.error("❌ Error testing real-time message handling:", error);
  }
}

// Run all tests
async function runAllTests() {
  console.log("🧪 Running deleted user chat tests...");
  console.log("=".repeat(50));

  await testDeletedUserMessages();
  console.log("-".repeat(30));

  await testDeletedUserMembers();
  console.log("-".repeat(30));

  await testRemovedUserMessages();
  console.log("-".repeat(30));

  await testRealtimeMessageHandling();
  console.log("-".repeat(30));

  console.log("✅ All tests completed!");
  console.log("=".repeat(50));
}

// Export functions for individual testing
window.testDeletedUserMessages = testDeletedUserMessages;
window.testDeletedUserMembers = testDeletedUserMembers;
window.testRemovedUserMessages = testRemovedUserMessages;
window.testRealtimeMessageHandling = testRealtimeMessageHandling;
window.runAllTests = runAllTests;

// Auto-run if this script is loaded
console.log("🧪 Deleted user chat test script loaded!");
console.log("Run 'runAllTests()' to execute all tests");
console.log("Or run individual tests:");
console.log("  - testDeletedUserMessages()");
console.log("  - testDeletedUserMembers()");
console.log("  - testRemovedUserMessages()");
console.log("  - testRealtimeMessageHandling()");
