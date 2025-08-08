'use server';

/**
 * @fileOverview A Genkit flow to retrieve chat history for a given session.
 *
 * - getChatHistory - A function that handles retrieving chat history.
 * - GetChatHistoryInput - The input type for the getChatHistory function.
 * - GetChatHistoryOutput - The return type for the getChatHistory function.
 */

import { ai } from '@/ai/genkit';
import { getHistory } from '@/services/chat-history';
import type { GetChatHistoryInput, GetChatHistoryOutput } from '@/ai/schemas/chat-history';
import { GetChatHistoryInputSchema, GetChatHistoryOutputSchema } from '@/ai/schemas/chat-history';

export async function getChatHistory(input: GetChatHistoryInput): Promise<GetChatHistoryOutput> {
    return getChatHistoryFlow(input);
}

const getChatHistoryFlow = ai.defineFlow(
  {
    name: 'getChatHistoryFlow',
    inputSchema: GetChatHistoryInputSchema,
    outputSchema: GetChatHistoryOutputSchema,
  },
  async ({ sessionId }) => {
    const history = await getHistory(sessionId);
    // Important: The `getHistory` function from mongodb returns documents with `_id`, which is not serializable.
    // We must map the results to a plain object that matches the output schema.
    return history.map(item => ({
        role: item.role,
        content: item.content,
    }));
  }
);
