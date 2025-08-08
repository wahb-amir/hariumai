'use server';

/**
 * @fileOverview A Genkit flow to retrieve all chat sessions for a given user.
 *
 * - getChatSessions - A function that handles retrieving chat sessions.
 * - GetChatSessionsInput - The input type for the getChatSessions function.
 * - GetChatSessionsOutput - The return type for the getChatSessions function.
 */

import { ai } from '@/ai/genkit';
import { getSessions } from '@/services/chat-history';
import { z } from 'genkit';
import { GetChatSessionsInputSchema, GetChatSessionsOutputSchema } from '@/ai/schemas/chat-session';


export type GetChatSessionsInput = z.infer<typeof GetChatSessionsInputSchema>;
export type GetChatSessionsOutput = z.infer<typeof GetChatSessionsOutputSchema>;

export async function getChatSessions(input: GetChatSessionsInput): Promise<GetChatSessionsOutput> {
    return getChatSessionsFlow(input);
}

const getChatSessionsFlow = ai.defineFlow(
  {
    name: 'getChatSessionsFlow',
    inputSchema: GetChatSessionsInputSchema,
    outputSchema: GetChatSessionsOutputSchema,
  },
  async ({ userId }) => {
    const sessions = await getSessions(userId);
    // Important: The `getSessions` function from mongodb returns documents with `_id`, which is not serializable.
    // We must map the results to a plain object that matches the output schema.
    return sessions.map(item => ({
        sessionId: item.sessionId,
        title: item.title,
    }));
  }
);
