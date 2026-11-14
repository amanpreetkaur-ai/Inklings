
import { NextResponse } from "next/server";
import { createWriterServerClient } from "@/lib/supabase/writer-server";

export async function POST(request: Request) {
  try {
    const writerSupabase = await createWriterServerClient();

    const {
      data: { user },
      error: authError,
    } = await writerSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please log in to your Writer account." },
        { status: 401 }
      );
    }

    const { storyId } = await request.json();

    if (typeof storyId !== "string" || !storyId.trim()) {
      return NextResponse.json(
        { error: "A valid story ID is required." },
        { status: 400 }
      );
    }

    const { data: story, error: storyError } = await writerSupabase
      .from("stories")
      .select(
        "id, author_id, title, slug, genre, description, content, status, published_at, updated_at, cover_image_url, language, work_type, is_featured"
      )
      .eq("id", storyId)
      .eq("author_id", user.id)
      .maybeSingle();

    if (storyError) {
      console.error("Writer story lookup failed:", storyError.message);
      return NextResponse.json(
        { error: "Could not load your story." },
        { status: 500 }
      );
    }

    if (!story) {
      return NextResponse.json(
        { error: "Story not found or you do not own it." },
        { status: 404 }
      );
    }

    if (story.status !== "published") {
      return NextResponse.json(
        { error: "Only published stories can be synced." },
        { status: 400 }
      );
    }

    const readerUrl = process.env.READER_SUPABASE_URL;
    const readerSecret = process.env.READER_SUPABASE_SERVICE_ROLE_KEY;

    if (!readerUrl || !readerSecret) {
      console.error("Reader Supabase environment variables are missing.");
      return NextResponse.json(
        { error: "Reader connection is not configured." },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();

    const readerResponse = await fetch(
      `${readerUrl.replace(/\/$/, "")}/rest/v1/published_stories?on_conflict=id`,
      {
        method: "POST",
        headers: {
          apikey: readerSecret,
          Authorization: `Bearer ${readerSecret}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({
          id: story.id,
          author_id: story.author_id,
          title: story.title,
          slug: story.slug,
          genre: story.genre,
          description: story.description ?? "",
          content: story.content ?? "",
          cover_image_url: story.cover_image_url ?? null,
          language: story.language ?? "English",
          work_type: story.work_type ?? "story",
          is_featured: story.is_featured ?? false,
          status: "published",
          published_at: story.published_at ?? now,
          updated_at: story.updated_at ?? now,
        }),
        cache: "no-store",
      }
    );

    if (!readerResponse.ok) {
      const details = await readerResponse.text();
      console.error("Reader story sync failed:", details);

      return NextResponse.json(
        {
          error: "Could not sync the story to the Reader website.",
          details,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Published story and metadata synced to Reader.",
    });
  } catch (error: unknown) {
    console.error("Story sync API failed:", error);

    return NextResponse.json(
      {
        error: "An unexpected error occurred while syncing the story.",
        details:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const writerSupabase = await createWriterServerClient();

    const {
      data: { user },
      error: authError,
    } = await writerSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please log in to your Writer account." },
        { status: 401 }
      );
    }

    const { storyId } = await request.json();

    if (typeof storyId !== "string" || !storyId.trim()) {
      return NextResponse.json(
        { error: "A valid story ID is required." },
        { status: 400 }
      );
    }

    const readerUrl = process.env.READER_SUPABASE_URL;
    const readerSecret = process.env.READER_SUPABASE_SERVICE_ROLE_KEY;

    if (!readerUrl || !readerSecret) {
      console.error("Reader Supabase environment variables are missing.");
      return NextResponse.json(
        { error: "Reader connection is not configured." },
        { status: 500 }
      );
    }

    const readerResponse = await fetch(
      `${readerUrl.replace(/\/$/, "")}/rest/v1/published_stories?id=eq.${storyId}&author_id=eq.${user.id}`,
      {
        method: "DELETE",
        headers: {
          apikey: readerSecret,
          Authorization: `Bearer ${readerSecret}`,
        },
        cache: "no-store",
      }
    );

    if (!readerResponse.ok) {
      const details = await readerResponse.text();
      console.error("Reader story removal failed:", details);
      return NextResponse.json(
        {
          error: "Could not remove story from reader library.",
          details,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Story removed from Reader library.",
    });
  } catch (error: unknown) {
    console.error("Story delete API failed:", error);

    return NextResponse.json(
      {
        error: "An unexpected error occurred while unpublishing the story.",
        details:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
