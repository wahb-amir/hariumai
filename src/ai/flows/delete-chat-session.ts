
'use server';

/**
 * @fileOverview A Genkit flow to delete a single chat session.
 */

import { ai } from '@/ai/genkit';
import { deleteSession as deleteSessionFromDb } from '@/services/chat-history';
import { z } from 'genkit';

const DeleteChatSessionInputSchema = z.object({
    sessionId: z.string().describe("The ID of the session to delete."),
    userId: z.string().describe("The user ID who owns the session."),
});
export type DeleteChatSessionInput = z.infer<typeof DeleteChatSessionInputSchema>;

const DeleteChatSessionOutputSchema = z.object({
    success: z.boolean(),
});
export type DeleteChatSessionOutput = z.infer<typeof DeleteChatSessionOutputSchema>;

export async function deleteChatSession(input: DeleteChatSessionInput): Promise<DeleteChatSessionOutput> {
    return deleteChatSessionFlow(input);
}

const deleteChatSessionFlow = ai.defineFlow(
  {
    name: 'deleteChatSessionFlow',
    inputSchema: DeleteChatSessionInputSchema,
    outputSchema: DeleteChatSessionOutputSchema,
  },
  async ({ sessionId, userId }) => {
    // We pass userId to the service to ensure a user can only delete their own sessions.
    const result = await deleteSessionFromDb(sessionId, userId);
    return {
        success: result.deletedCount > 0,
    };
  }
);
