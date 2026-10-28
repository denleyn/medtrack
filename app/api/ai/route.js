import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message, tickets } = await req.json();

    console.error("GROQ_API_KEY exists:", Boolean(process.env.GROQ_API_KEY));

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: "You are an IT support assistant." },
          { role: "user", content: message },
        ],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(res.status, errorText);
      return Response.json({ error: errorText }, { status: res.status });
    }

    const data = await res.json();

    // ✅ Groq may return text in message.content OR text
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      data?.choices?.[0]?.text?.trim() ||
      "AI could not generate a response.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
