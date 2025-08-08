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
import { z } from 'genkit';

export const GetChatHistoryInputSchema = z.object({
    sessionId: z.string().describe("The session ID for the user whose history should be retrieved."),
});
export type GetChatHistoryInput = z.infer<typeof GetChatHistoryInputSchema>;

export const GetChatHistoryOutputSchema = z.array(
    z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
    })
).describe("The chat history.");
export type GetChatHistoryOutput = z.infer<typeof GetChatHistoryOutputSchema>;

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
    return history.map(item => ({
        role: item.role,
        content: item.content,
    }));
  }
);
