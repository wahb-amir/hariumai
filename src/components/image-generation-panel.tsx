
"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { generateImageFromText } from "@/ai/flows/generate-image-from-text";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Eye, Download, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { HariumLogo } from "./harium-logo";

export function ImageGenerationPanel() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setImageUrl(null);

    try {
      const result = await generateImageFromText({ prompt });
      setImageUrl(result.imageUrl);
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate image.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveImage = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "harium-ai-generated-image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-black">Image Generation</h1>
        <p className="text-muted-foreground">
          Create stunning images from text descriptions using AI.
        </p>
      </div>
      <form onSubmit={handleGenerateImage} className="space-y-4">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A photo of an astronaut riding a horse on Mars, cinematic lighting"
          className="resize-none"
          rows={3}
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !prompt.trim()} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate Image
        </Button>
      </form>

      <Card>
        <CardContent className="p-4">
          <div className="aspect-square w-full rounded-lg overflow-hidden flex items-center justify-center bg-secondary relative group">
            {isLoading && <Skeleton className="h-full w-full" />}
            {!isLoading && imageUrl && (
              <>
                <Image
                  src={imageUrl}
                  alt={prompt}
                  width={512}
                  height={512}
                  className="object-cover w-full h-full transition-opacity duration-500 opacity-100"
                  data-ai-hint="generated image"
                />
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                  <DialogTrigger asChild>
                    <button className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      <Eye className="h-12 w-12 text-white" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Image Preview</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      <Image
                        src={imageUrl}
                        alt={prompt}
                        width={1024}
                        height={1024}
                        className="rounded-lg object-contain w-full h-full"
                        data-ai-hint="generated image preview"
                      />
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => { /* Implement Edit functionality later */ toast({ title: "Coming Soon!", description: "Image editing will be available in a future update."})}}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Image
                        </Button>
                        <Button onClick={handleSaveImage}>
                            <Download className="mr-2 h-4 w-4" />
                            Save Image
                        </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
            {!isLoading && !imageUrl && (
              <div className="text-center text-muted-foreground p-8">
                <Sparkles className="mx-auto h-12 w-12 mb-4" />
                <p>Your generated image will appear here.</p>
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
