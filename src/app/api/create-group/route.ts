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
  description: z.string().max(500).optional(),
  cover_image: z.string().optional(),
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
    };

    console.log("Attempting to insert payload:", payload);

    const { data, error: insertError } = await supabase
      .from("groups")
      .insert(payload)
      .select();

    if (insertError) {
      console.error("Raw insert error:", insertError);
      return new Response(
        `Failed to create group: ${JSON.stringify(insertError)}`,
        { status: 500 }
      );
    }

    console.log("Insert successful, data:", data);
    return new Response("Group created", { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
