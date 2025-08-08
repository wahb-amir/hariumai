/**
 * @fileOverview Defines the Zod schemas and TypeScript types for chat title generation.
 */
import { z } from 'genkit';

export const GenerateChatTitleInputSchema = z.object({
  prompt: z.string().describe('The initial user prompt for the conversation.'),
});
export type GenerateChatTitleInput = z.infer<typeof GenerateChatTitleInputSchema>;

export const GenerateChatTitleOutputSchema = z.string().describe('A short, descriptive title for the chat (max 5 words).');
export type GenerateChatTitleOutput = z.infer<typeof GenerateChatTitleOutputSchema>;
