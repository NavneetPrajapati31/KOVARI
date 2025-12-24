
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    const body = await request.json();
    const { interestId, action } = body;

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!interestId || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    const status = action === 'accept' ? 'accepted' : 'rejected';

    const { data: updatedInterest, error } = await supabaseAdmin
      .from("match_interests")
      .update({ status })
      .eq("id", interestId)
      .select()
      .single();

    if (error) {
      console.error("Error updating interest:", error);
      return NextResponse.json(
        { error: "Failed to update interest" },
        { status: 500 }
      );
    }
    
    // If accepted, initialize a chat by sending a system/welcome message
    if (action === "accept" && updatedInterest) {
      const senderId = updatedInterest.from_user_id; // The person who sent the interest
      const receiverId = updatedInterest.to_user_id; // The current user who accepted it

      try {
        // Initialize chat with a "phantom" message to make it appear in inbox without content
        // This relies on use-direct-inbox logic: matches (media_url && media_type) -> set lastMessage="" 
        // and Inbox UI fallthrough to display empty string.
        
        const { error: msgError } = await supabaseAdmin
          .from("direct_messages")
          .insert({
            sender_id: receiverId, // Initiate from the acceptor
            receiver_id: senderId,
            media_type: "init",
            media_url: "system", // Required to trigger the media condition in hook
            is_encrypted: false,
            created_at: new Date().toISOString()
          });

        if (msgError) {
          console.error("Error creating init message:", msgError);
        }
      } catch (err) {
        console.error("Insertion error:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
