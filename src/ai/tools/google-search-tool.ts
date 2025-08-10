
'use server';
/**
 * @fileOverview A Genkit tool for performing Google searches.
 */
import { ai } from '@/ai/genkit';
import { searchGoogle } from '@/services/google-search';
import { z } from 'genkit';

export const googleSearchTool = ai.defineTool(
  {
    name: 'googleSearch',
    description: 'Performs a Google search to find up-to-date information from the web. Use this to answer questions about current events, specific facts, or anything that requires real-time information.',
    inputSchema: z.object({
      query: z.string().describe('The search query.'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    return await searchGoogle(input.query);
  }
);
