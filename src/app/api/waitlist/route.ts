import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, whatsapp, usecase } = body;

    if (!name || !email) {
      return NextResponse.json(
        { status: "error", message: "Name and email are required" },
        { status: 400 }
      );
    }

    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    
    if (!scriptUrl) {
      console.warn("GOOGLE_SCRIPT_URL is not set. Simulating a successful response.");
      return NextResponse.json({ status: "success", position: 1337 });
    }

    // Forward to Google Apps Script
    // We prepend a single quote to the whatsapp number so Google Sheets treats it as text, not a formula
    const safeWhatsapp = whatsapp ? (whatsapp.startsWith("'") ? whatsapp : `'${whatsapp}`) : "";
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, whatsapp: safeWhatsapp, usecase }),
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error("Failed to parse JSON from Apps Script. Response was:", text.substring(0, 200));
      return NextResponse.json(
        { status: "error", message: "Invalid response from Google Apps Script. Please verify your GOOGLE_SCRIPT_URL ends with '/exec'." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Waitlist API Error:", error);
    return NextResponse.json(
      { status: "error", message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
