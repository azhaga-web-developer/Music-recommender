import { handleGroqChat } from "../../server/groq-chat.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { "Content-Type": "application/json", Allow: "POST" }, body: JSON.stringify({ error: "Method not allowed." }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Invalid request." }) };
  }

  const result = await handleGroqChat(body, process.env.GROQ_API_KEY);
  return {
    statusCode: result.status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(result.body),
  };
}
