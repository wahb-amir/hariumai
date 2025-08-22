
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { generateVideoFromText } from "@/ai/flows/generate-video-from-text";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Clapperboard, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { HariumLogo } from "./harium-logo";

const loadingSteps = [
    "Contacting video generation service...",
    "Initializing Veo model...",
    "Processing text prompt...",
    "Allocating GPU resources...",
    "Generating initial video frames...",
    "Upscaling and refining video...",
    "Adding finishing touches...",
    "Finalizing video stream...",
    "Almost there..."
];

export function VideoGenerationPanel() {
  const [prompt, setPrompt] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(loadingSteps[0]);
  const { toast } = useToast();

  const handleGenerateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setVideoUrl(null);

    let stepIndex = 0;
    const interval = setInterval(() => {
        stepIndex = (stepIndex + 1) % loadingSteps.length;
        setLoadingText(loadingSteps[stepIndex]);
    }, 8000); // Change text every 8 seconds

    try {
      const result = await generateVideoFromText({ prompt });
      setVideoUrl(result.videoUrl);
    } catch (error) {
      console.error("Error generating video:", error);
      toast({
        variant: "destructive",
        title: "Error Generating Video",
        description: "Could not generate video. The service may be busy or the prompt may have been blocked. Please try again later.",
      });
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  const handleSaveVideo = () => {
    if (!videoUrl) return;
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = "harium-ai-generated-video.mp4";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-black">Video Generation</h1>
        <p className="text-muted-foreground">
          Create short video clips from text descriptions using Veo.
        </p>
      </div>
      <form onSubmit={handleGenerateVideo} className="space-y-4">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A majestic dragon soaring over a mystical forest at dawn."
          className="resize-none"
          rows={3}
          disabled={isLoading}
        />
        <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || !prompt.trim()} className="w-full">
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate Video
            </Button>
        </div>
      </form>

      <Card>
        <CardContent className="p-4">
          <div className="aspect-video w-full rounded-lg overflow-hidden flex items-center justify-center bg-secondary relative group">
            {isLoading && (
                <div className="flex flex-col items-center justify-center text-center p-4">
                    <Loader2 className="h-12 w-12 animate-spin mb-4" />
                    <p className="font-semibold text-lg">Generating Video</p>
                    <p className="text-muted-foreground text-sm">{loadingText}</p>
                    <p className="text-xs text-muted-foreground/80 mt-4">(This can take up to 2 minutes)</p>
                </div>
            )}
            {!isLoading && videoUrl && (
              <>
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-contain"
                />
                 <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button onClick={handleSaveVideo} size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Save Video
                    </Button>
                </div>
              </>
            )}
            {!isLoading && !videoUrl && (
              <div className="text-center text-muted-foreground p-8">
                <Clapperboard className="mx-auto h-12 w-12 mb-4" />
                <p>Your generated video will appear here.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground">
        <span>Powered by</span>
        <HariumLogo className="h-6 w-6" />
        <span className="font-bold">HariumAI</span>
    </div>
    </div>
  );
}
