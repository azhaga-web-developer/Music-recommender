const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

export async function handleYoutubeSearch(query, apiKey) {
  const searchTerm = typeof query === "string" ? query.trim().slice(0, 200) : "";
  if (!searchTerm) return { status: 400, body: { error: "Provide a song title to search for." } };
  if (!apiKey) return { status: 503, body: { error: "Song playback search is not configured yet." } };

  const url = new URL(YOUTUBE_SEARCH_URL);
  url.search = new URLSearchParams({
    part: "snippet",
    maxResults: "1",
    q: searchTerm,
    type: "video",
    key: apiKey,
  });

  let response;
  try {
    response = await fetch(url);
  } catch {
    return { status: 502, body: { error: "Could not reach YouTube. Please try again." } };
  }

  if (!response.ok) {
    return { status: response.status === 429 ? 429 : 502, body: { error: "YouTube search could not complete. Check the server API key and quota." } };
  }

  const data = await response.json().catch(() => null);
  return { status: 200, body: { items: Array.isArray(data?.items) ? data.items : [] } };
}