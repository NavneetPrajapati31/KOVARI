import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

// --- Schema validation ---
const GroupSchema = z.object({
  name: z.string().min(3),
  destination: z.string().min(2),
  start_date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
  end_date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
  is_public: z.boolean(),
  description: z.string().max(500).optional().nullable(),
  cover_image: z.string().optional().nullable(),
  non_smokers: z.string().optional().nullable(),
  non_drinkers: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    let body: any;
    let parsed;
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = {
        name: formData.get("name"),
        destination: formData.get("destination"),
        start_date: formData.get("start_date"),
        end_date: formData.get("end_date"),
        is_public: String(formData.get("is_public")) === "true",
        description: formData.get("description") || undefined,
        cover_image:
          formData.get("cover_image") instanceof File
            ? (formData.get("cover_image") as File).name // You may want to upload the file to storage and get a URL here
            : formData.get("cover_image") || undefined,
        non_smokers: formData.get("non_smokers") || null,
        non_drinkers: formData.get("non_drinkers") || null,
      };
      parsed = GroupSchema.safeParse(body);
    } else {
      body = await req.json();
      parsed = GroupSchema.safeParse(body);
    }

    if (!parsed.success) {
      console.error("Validation error:", parsed.error);
      return new Response(JSON.stringify(parsed.error.flatten()), {
        status: 400,
      });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
          set: (name, value, options) => {
            cookieStore.set(name, value, options);
          },
          remove: (name, options) => {
            cookieStore.delete(name);
          },
        },
      }
    );

    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (userError) {
      console.error("User fetch error:", userError);
      return new Response("Database error while fetching user", {
        status: 500,
      });
    }

    if (!userRow) {
      console.error("User not found for clerk_user_id:", userId);
      return new Response("User not found", { status: 404 });
    }

    const payload = {
      creator_id: userRow.id,
      ...parsed.data,
      cover_image: parsed.data.cover_image || null,
      non_smokers: parsed.data.non_smokers || null,
      non_drinkers: parsed.data.non_drinkers || null,
    };

    console.log("Attempting to insert payload:", payload);

    const { data: groupData, error: insertError } = await supabase
      .from("groups")
      .insert(payload)
      .select()
      .single();

    if (insertError) {
      console.error("Raw insert error:", insertError);
      return new Response(
        `Failed to create group: ${JSON.stringify(insertError)}`,
        { status: 500 }
      );
    }

    if (!groupData) {
      return new Response("Failed to create group, no data returned.", {
        status: 500,
      });
    }

    // Try to create group membership with multiple fallback approaches
    const membershipPayload = {
      group_id: groupData.id,
      user_id: userRow.id,
      status: "accepted",
      joined_at: new Date().toISOString(),
      role: "admin",
    };

    console.log("Attempting to insert membership payload:", membershipPayload);

    // First attempt: Standard insertion
    let { error: membershipError } = await supabase
      .from("group_memberships")
      .insert(membershipPayload);

    if (membershipError) {
      console.error("First attempt failed:", membershipError);
      
      // Second attempt: Try without joined_at timestamp
      const fallbackPayload = {
        group_id: groupData.id,
        user_id: userRow.id,
        status: "accepted",
        role: "admin",
      };
      
      console.log("Trying fallback approach without joined_at:", fallbackPayload);
      
      const { error: fallbackError } = await supabase
        .from("group_memberships")
        .insert(fallbackPayload);
      
      if (fallbackError) {
        console.error("Fallback attempt also failed:", fallbackError);
        
        // Third attempt: Try with minimal required fields only
        const minimalPayload = {
          group_id: groupData.id,
          user_id: userRow.id,
        };
        
        console.log("Trying minimal payload:", minimalPayload);
        
        const { error: minimalError } = await supabase
          .from("group_memberships")
          .insert(minimalPayload);
        
        if (minimalError) {
          console.error("All attempts failed. Rolling back group creation.");
          
          // Rollback group creation
          await supabase.from("groups").delete().eq("id", groupData.id);
          
          // Check if this is the specific date_of_birth error
          if (minimalError.message && minimalError.message.includes('date_of_birth')) {
            return new Response(
              JSON.stringify({
                error: "Database schema issue: Missing date_of_birth column",
                details: "The database is missing a required column. Please run the following SQL in your Supabase dashboard: ALTER TABLE users ADD COLUMN date_of_birth DATE;",
                code: "MISSING_DATE_OF_BIRTH_COLUMN",
                originalError: minimalError.message,
                fix: "Run this SQL command in Supabase SQL Editor: ALTER TABLE users ADD COLUMN date_of_birth DATE;"
              }),
              { 
                status: 500,
                headers: { "Content-Type": "application/json" }
              }
            );
          }
          
          return new Response(
            JSON.stringify({
              error: "Database schema issue prevents group creation",
              details: "The database has a constraint that references a missing column. Please contact support.",
              code: "SCHEMA_ERROR",
              originalError: membershipError.message
            }),
            { 
              status: 500,
              headers: { "Content-Type": "application/json" }
            }
          );
        } else {
          console.log("Minimal payload succeeded");
        }
      } else {
        console.log("Fallback approach succeeded");
      }
    } else {
      console.log("Standard membership creation succeeded");
    }

    console.log("Group and membership created successfully:", groupData);
    return new Response(JSON.stringify(groupData), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}   
