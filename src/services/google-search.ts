
'use server';
/**
 * @fileOverview A service to interact with the Google Custom Search API.
 *
 * - searchGoogle - A function that performs a search and returns the results.
 */
import fetch from 'node-fetch';

const API_KEY = process.env.GOOGLE_API_KEY;
const CSE_ID = process.env.GOOGLE_CSE_ID;

if (!API_KEY || !CSE_ID) {
  console.warn("Google API Key or CSE ID is not set. Real web search will be disabled.");
}

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export async function searchGoogle(query: string): Promise<SearchResult[] | string> {
  if (!API_KEY || !CSE_ID) {
    return "Web search is not configured.";
  }

  const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CSE_ID}&q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Search API Error:', errorData);
      return `Error from search API: ${errorData.error.message}`;
    }
    const data: any = await response.json();

    if (!data.items || data.items.length === 0) {
      return "No results found.";
    }

    return data.items.slice(0, 5).map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    }));
  } catch (error) {
    console.error('Failed to fetch from Google Search API:', error);
    return 'Failed to perform search due to a network or configuration error.';
  }
}
