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
  isImageQuery: z.boolean().describe('Whether the query is for an image.'),
});
export type ConverseWithAiOutput = z.infer<typeof ConverseWithAiOutputSchema>;

export async function converseWithAi(input: ConverseWithAiInput): Promise<ConverseWithAiOutput> {
  return converseWithAiFlow(input);
}

const converseWithAiPrompt = ai.definePrompt({
  name: 'converseWithAiPrompt',
  input: {schema: ConverseWithAiInputSchema},
  output: {schema: ConverseWithAiOutputSchema},
  prompt: `You are a helpful AI assistant. Analyze the user's prompt and determine if they are asking to generate an image.

If the prompt is asking to create, generate, draw, or show an image, picture, or photo of something, set the isImageQuery field to true and set the response field to "Visit this page to create your dedicated image:".

Otherwise, set isImageQuery to false and provide a helpful text-based response to the user's prompt.

Prompt:
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
