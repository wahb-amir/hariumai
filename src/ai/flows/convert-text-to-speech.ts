'use server';
/**
 * @fileOverview Converts text to speech using the Gemini API.
 *
 * - convertTextToSpeech - A function that handles the text-to-speech conversion process.
 * - ConvertTextToSpeechInput - The input type for the convertTextToSpeech function.
 * - ConvertTextToSpeechOutput - The return type for the convertTextToSpeech function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const ConvertTextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
  voice: z.string().optional().default('Algenib').describe('The voice to use for the speech.'),
});

export type ConvertTextToSpeechInput = z.infer<typeof ConvertTextToSpeechInputSchema>;

const ConvertTextToSpeechOutputSchema = z.object({
  media: z.string().describe('The audio data as a data URI.'),
});
export type ConvertTextToSpeechOutput = z.infer<typeof ConvertTextToSpeechOutputSchema>;

export async function convertTextToSpeech(input: ConvertTextToSpeechInput): Promise<ConvertTextToSpeechOutput> {
  return convertTextToSpeechFlow(input);
}

const convertTextToSpeechFlow = ai.defineFlow(
  {
    name: 'convertTextToSpeechFlow',
    inputSchema: ConvertTextToSpeechInputSchema,
    outputSchema: ConvertTextToSpeechOutputSchema,
  },
  async ({ text, voice }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Algenib' },
          },
        },
      },
      prompt: text,
    });
    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
