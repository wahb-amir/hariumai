/**
 * @fileOverview Defines the Zod schemas and TypeScript types for chat history operations.
 */
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
