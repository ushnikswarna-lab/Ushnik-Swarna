import { NextRequest, NextResponse } from "next/server";
import { sendNewsletterEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, subject, content } = body;

    if (!email || !subject || !content) {
      return NextResponse.json(
        { error: "Missing required fields: email, subject, content" },
        { status: 400 }
      );
    }

    await sendNewsletterEmail(email, subject, content);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending newsletter email:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send newsletter email" },
      { status: 500 }
    );
  }
}
