'use server';
/**
 * @fileOverview Video generation flow using Veo.
 *
 * - generateVideoFromText - A function that generates a video from text.
 * - GenerateVideoFromTextInput - The input type for the generateVideoFromText function.
 * - GenerateVideoFromTextOutput - The return type for the generateVideoFromText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { MediaPart } from 'genkit/media';

const GenerateVideoFromTextInputSchema = z.object({
  prompt: z.string().describe('The prompt to generate a video from.'),
});
export type GenerateVideoFromTextInput = z.infer<typeof GenerateVideoFromTextInputSchema>;

const GenerateVideoFromTextOutputSchema = z.object({
  videoUrl: z.string().describe('The generated video as a data URI.'),
});
export type GenerateVideoFromTextOutput = z.infer<typeof GenerateVideoFromTextOutputSchema>;

export async function generateVideoFromText(input: GenerateVideoFromTextInput): Promise<GenerateVideoFromTextOutput> {
  return generateVideoFromTextFlow(input);
}

const generateVideoFromTextFlow = ai.defineFlow(
  {
    name: 'generateVideoFromTextFlow',
    inputSchema: GenerateVideoFromTextInputSchema,
    outputSchema: GenerateVideoFromTextOutputSchema,
  },
  async ({prompt}) => {
    let { operation } = await ai.generate({
        model: 'googleai/veo-2.0-generate-001',
        prompt,
        config: {
          durationSeconds: 5,
          aspectRatio: '16:9',
        },
      });
  
      if (!operation) {
        throw new Error('Expected the model to return an operation');
      }
  
      // Wait until the operation completes. Note that this may take some time, maybe even up to a minute.
      while (!operation.done) {
        // Sleep for 5 seconds before checking again.
        await new Promise((resolve) => setTimeout(resolve, 5000));
        operation = await ai.checkOperation(operation);
      }
  
      if (operation.error) {
        throw new Error('Failed to generate video: ' + operation.error.message);
      }
  
      const video = operation.output?.message?.content.find((p) => !!p.media);
      if (!video || !video.media) {
        throw new Error('Failed to find the generated video');
      }

      const videoUrl = await downloadVideoAsDataURI(video.media);
      
      return { videoUrl };
  }
);

async function downloadVideoAsDataURI(video: MediaPart): Promise<string> {
    const fetch = (await import('node-fetch')).default;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }
  
    // Add API key before fetching the video.
    const videoDownloadResponse = await fetch(
      `${video.url}&key=${apiKey}`
    );
  
    if (
      !videoDownloadResponse ||
      videoDownloadResponse.status !== 200 ||
      !videoDownloadResponse.body
    ) {
      throw new Error('Failed to fetch video');
    }
  
    const videoBuffer = await videoDownloadResponse.buffer();
    const base64Video = videoBuffer.toString('base64');
    const contentType = video.contentType || 'video/mp4';

    return `data:${contentType};base64,${base64Video}`;
  }
