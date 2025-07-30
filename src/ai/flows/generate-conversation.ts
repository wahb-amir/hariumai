'use server';

/**
 * @fileOverview Implements the Genkit flow for text-based conversation with the AI assistant.
 *
 * - converseWithAi - A function that handles the conversation with the AI.
 * - ConverseWithAiInput - The input type for the converseWithAi function.
 * - ConverseWithAiOutput - The return type for the converseWithAi function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConverseWithAiInputSchema = z.object({
  prompt: z.string().describe('The prompt for the AI conversation.'),
});
export type ConverseWithAiInput = z.infer<typeof ConverseWithAiInputSchema>;

const ConverseWithAiOutputSchema = z.object({
  response: z.string().describe('The AI assistant response.'),
});
export type ConverseWithAiOutput = z.infer<typeof ConverseWithAiOutputSchema>;

export async function converseWithAi(input: ConverseWithAiInput): Promise<ConverseWithAiOutput> {
  return converseWithAiFlow(input);
}

const converseWithAiPrompt = ai.definePrompt({
  name: 'converseWithAiPrompt',
  input: {schema: ConverseWithAiInputSchema},
  output: {schema: ConverseWithAiOutputSchema},
  prompt: `You are a helpful AI assistant. Please respond to the following prompt:

{{{prompt}}}`,
});

const converseWithAiFlow = ai.defineFlow(
  {
    name: 'converseWithAiFlow',
    inputSchema: ConverseWithAiInputSchema,
    outputSchema: ConverseWithAiOutputSchema,
  },
  async input => {
    const {output} = await converseWithAiPrompt(input);
    return output!;
  }
);
