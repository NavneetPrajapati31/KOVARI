// Test script for Direct Chat Deleted Users functionality
// Run this in the browser console on any direct chat page

const BASE_URL = window.location.origin;

// Helper function to get current user UUID
async function getCurrentUserUuid() {
  try {
    const response = await fetch(`${BASE_URL}/api/profile/current`, {
      credentials: "include",
    });
    if (response.ok) {
      const data = await response.json();
      return data.userId;
    }
  } catch (error) {
    console.error("Error getting current user UUID:", error);
  }
  return null;
}

// Test 1: Check if direct chat loads with deleted user
async function testDirectChatWithDeletedUser() {
  console.log("Testing direct chat with deleted user...");

  try {
    // Get current user UUID
    const currentUserUuid = await getCurrentUserUuid();
    if (!currentUserUuid) {
      console.log("❌ Could not get current user UUID");
      return;
    }

    // Find a conversation with a deleted user (you'll need to manually set a user as deleted)
    console.log("ℹ️  To test this properly:");
    console.log("1. Set a user's deleted field to true in the profiles table");
    console.log("2. Navigate to a direct chat with that user");
    console.log("3. Verify that the header shows 'Anonymous'");
    console.log(
      "4. Verify that messages from the deleted user are still visible"
    );

    // Check if we're on a direct chat page
    const urlParams = new URLSearchParams(window.location.search);
    const pathSegments = window.location.pathname.split("/");
    const chatIndex = pathSegments.indexOf("chat");

    if (chatIndex !== -1 && pathSegments[chatIndex + 1]) {
      const partnerUuid = pathSegments[chatIndex + 1];
      console.log(`✅ Currently in direct chat with user: ${partnerUuid}`);

      // Check if partner is deleted
      const response = await fetch(`${BASE_URL}/api/profile/${partnerUuid}`, {
        credentials: "include",
      });

      if (response.ok) {
        const profile = await response.json();
        if (profile.deleted) {
          console.log(
            "✅ Partner is deleted - should show 'Anonymous' in header"
          );
        } else {
          console.log("ℹ️  Partner is not deleted - normal behavior expected");
        }
      } else {
        console.log("❌ Could not fetch partner profile");
      }
    } else {
      console.log("ℹ️  Not on a direct chat page");
    }
  } catch (error) {
    console.error("❌ Error testing direct chat with deleted user:", error);
  }
}

// Test 2: Check message display for deleted users
async function testMessageDisplayForDeletedUsers() {
  console.log("Testing message display for deleted users...");

  try {
    // Check if messages container exists
    const messagesContainer = document.querySelector(
      '[data-testid="messages-container"]'
    );
    if (!messagesContainer) {
      console.log("ℹ️  Messages container not found - not on a chat page");
      return;
    }

    // Look for messages from deleted users
    const messages = messagesContainer.querySelectorAll('[role="listitem"]');
    console.log(`Found ${messages.length} messages`);

    // Check if any messages show "Anonymous" or "Deleted User"
    let deletedUserMessages = 0;
    messages.forEach((msg, index) => {
      const messageText = msg.textContent || "";
      if (
        messageText.includes("Anonymous") ||
        messageText.includes("Deleted User")
      ) {
        deletedUserMessages++;
        console.log(`Message ${index + 1} appears to be from a deleted user`);
      }
    });

    console.log(`✅ Messages from deleted users found: ${deletedUserMessages}`);
  } catch (error) {
    console.error("❌ Error testing message display:", error);
  }
}

// Test 3: Check header display for deleted users
async function testHeaderDisplayForDeletedUsers() {
  console.log("Testing header display for deleted users...");

  try {
    // Look for the header with user information
    const header = document.querySelector("h1, h2, h3, .font-semibold");
    if (header) {
      const headerText = header.textContent || "";
      console.log(`Header text: "${headerText}"`);

      if (headerText.includes("Anonymous")) {
        console.log("✅ Header correctly shows 'Anonymous' for deleted user");
      } else {
        console.log("ℹ️  Header shows normal user name");
      }
    } else {
      console.log("ℹ️  Header not found");
    }
  } catch (error) {
    console.error("❌ Error testing header display:", error);
  }
}

// Test 4: Check if chat is accessible for deleted users
async function testChatAccessibilityForDeletedUsers() {
  console.log("Testing chat accessibility for deleted users...");

  try {
    // Check if message input is disabled
    const messageInput = document.querySelector(
      'textarea[placeholder*="message"], input[placeholder*="message"]'
    );
    if (messageInput) {
      const isDisabled = messageInput.disabled;
      console.log(`Message input disabled: ${isDisabled}`);

      if (!isDisabled) {
        console.log("✅ Chat is accessible - can send messages");
      } else {
        console.log("⚠️  Chat input is disabled");
      }
    } else {
      console.log("ℹ️  Message input not found");
    }

    // Check if there are any error messages about deleted users
    const errorMessages = document.querySelectorAll(".text-destructive");
    let hasDeletedUserError = false;
    errorMessages.forEach((error) => {
      const text = error.textContent || "";
      if (text.includes("no longer exists") || text.includes("deleted")) {
        hasDeletedUserError = true;
        console.log(`Found error message: "${text}"`);
      }
    });

    if (!hasDeletedUserError) {
      console.log("✅ No blocking error messages for deleted users");
    } else {
      console.log("⚠️  Found error messages that might block access");
    }
  } catch (error) {
    console.error("❌ Error testing chat accessibility:", error);
  }
}

// Run all tests
async function runAllDirectChatTests() {
  console.log("🧪 Running all direct chat deleted user tests...");
  console.log("=".repeat(50));

  await testDirectChatWithDeletedUser();
  console.log("-".repeat(30));

  await testMessageDisplayForDeletedUsers();
  console.log("-".repeat(30));

  await testHeaderDisplayForDeletedUsers();
  console.log("-".repeat(30));

  await testChatAccessibilityForDeletedUsers();
  console.log("-".repeat(30));

  console.log("✅ All tests completed!");
  console.log("=".repeat(50));
}

// Export functions for manual testing
window.testDirectChatWithDeletedUser = testDirectChatWithDeletedUser;
window.testMessageDisplayForDeletedUsers = testMessageDisplayForDeletedUsers;
window.testHeaderDisplayForDeletedUsers = testHeaderDisplayForDeletedUsers;
window.testChatAccessibilityForDeletedUsers =
  testChatAccessibilityForDeletedUsers;
window.runAllDirectChatTests = runAllDirectChatTests;

console.log("📝 Direct Chat Deleted Users Test Script Loaded!");
console.log("Available functions:");
console.log("- testDirectChatWithDeletedUser()");
console.log("- testMessageDisplayForDeletedUsers()");
console.log("- testHeaderDisplayForDeletedUsers()");
console.log("- testChatAccessibilityForDeletedUsers()");
console.log("- runAllDirectChatTests()");
