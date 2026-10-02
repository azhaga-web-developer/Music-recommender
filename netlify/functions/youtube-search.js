import { handleYoutubeSearch } from "../../server/youtube-search.js";

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers: { "Content-Type": "application/json", Allow: "GET" }, body: JSON.stringify({ error: "Method not allowed." }) };
  }

  const result = await handleYoutubeSearch(event.queryStringParameters?.q, process.env.YOUTUBE_API_KEY);
  return {
    statusCode: result.status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(result.body),
  };
}