const MODEL = "openai/gpt-oss-20b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const CHAT_SYSTEM_PROMPT =
  "You are Aura Assistant, a helpful and friendly music expert for AuraBeats, a Tamil music streaming app. Help users with recommendations, artist trivia, and app features. Keep responses concise. Whenever you recommend multiple songs, format them as a clean numbered list with one song per line in the form '1. Song Title — Artist'. Add at most one short introduction and keep any reasons brief. Never put a list of songs into a paragraph.";

const RECOMMENDATION_SYSTEM_PROMPT = `You are a thoughtful music curator. This app focuses on Tamil music, so recommend Tamil songs by default; follow the user's request if they ask for another language. Carefully use every preference the user gives, including mood, situation, language, genre, energy, tempo, era, favorite artists, and artists or songs to avoid. Prioritize a close emotional and musical match over popularity. Recommend 10 distinct, real songs with accurate titles and artist credits. Never invent a song or artist; if uncertain, choose a well-known track you can identify confidently. Avoid repeating an artist more than twice unless the user specifically requests that artist. Give each song one short reason tied to the user's stated preferences. Return only a valid JSON object with exactly this structure: {"recommendations":[{"title":"Song","artist":"Artist","reason":"Why it matches"}]}. Do not include markdown or text outside the JSON.`;

export async function handleGroqChat(body, apiKey) {
  if (!apiKey) {
    return { status: 503, body: { error: "The chatbot is not configured yet. Add GROQ_API_KEY to the project environment and restart the app." } };
  }

  const type = body?.type;
  let messages;
  if (type === "recommendations") {
    const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 2000) : "";
    if (!prompt) return { status: 400, body: { error: "Enter a mood or describe what you want to hear." } };
    messages = [
      { role: "system", content: RECOMMENDATION_SYSTEM_PROMPT },
      { role: "user", content: `User mood: ${prompt}` },
    ];
  } else if (type === "chat") {
    if (!Array.isArray(body.messages)) {
      return { status: 400, body: { error: "Send a message to start chatting." } };
    }
    const conversation = body.messages
      .filter((message) => ["user", "assistant"].includes(message?.role) && typeof message.content === "string")
      .slice(-20)
      .map((message) => ({ role: message.role, content: message.content.slice(0, 4000) }));
    if (!conversation.length || conversation.at(-1).role !== "user") {
      return { status: 400, body: { error: "Send a message to start chatting." } };
    }
    messages = [{ role: "system", content: CHAT_SYSTEM_PROMPT }, ...conversation];
  } else {
    return { status: 400, body: { error: "Unknown chat request." } };
  }

  let response;
  try {
    const recommendationMode = type === "recommendations";
    response = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: recommendationMode ? 0.4 : 0.7,
        max_completion_tokens: recommendationMode ? 4096 : 1200,
        reasoning_effort: "low",
        include_reasoning: false,
        ...(recommendationMode ? { response_format: { type: "json_object" } } : {}),
      }),
    });
  } catch {
    return { status: 502, body: { error: "Could not reach Groq. Check your internet connection and try again." } };
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return { status: 502, body: { error: "Groq rejected GROQ_API_KEY. Check that it is a valid, active key, then restart the app." } };
    }
    if (response.status === 429) {
      return { status: 429, body: { error: "Groq is receiving too many requests right now. Wait a moment and try again." } };
    }
    return { status: 502, body: { error: "Groq could not complete the request. Please try again shortly." } };
  }

  const data = await response.json().catch(() => null);
  const choice = data?.choices?.[0];
  const content = choice?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    const reason = choice?.finish_reason ? ` (finish reason: ${choice.finish_reason})` : "";
    console.warn("Groq returned no assistant text", {
      model: data?.model || MODEL,
      finishReason: choice?.finish_reason || "unknown",
      completionTokens: data?.usage?.completion_tokens,
    });
    return { status: 502, body: { error: `Groq did not return an answer${reason}. Please try again.` } };
  }
  return { status: 200, body: { content } };
}
