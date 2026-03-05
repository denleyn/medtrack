import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req) {
  try {
    const { message, tickets } = await req.json();

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are an IT support assistant." },
          { role: "user", content: message }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    // ✅ Groq may return text in message.content OR text
    const reply =
      response.data?.choices?.[0]?.message?.content?.trim() ||
      response.data?.choices?.[0]?.text?.trim() ||
      "AI could not generate a response.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("AI API error:", err.response?.data || err.message);
    return NextResponse.json({ reply: "AI request failed." });
  }
}