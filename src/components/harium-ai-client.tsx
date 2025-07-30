"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatPanel } from "./chat-panel";
import { ImagePanel } from "./image-panel";
import { Bot } from "lucide-react";

export function HariumAiClient() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold font-headline">HariumAI</h1>
        </div>
        <p className="text-sm text-muted-foreground hidden md:block">Your multi-modal AI assistant.</p>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <Tabs defaultValue="chat" className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="image">Image Generation</TabsTrigger>
          </TabsList>
          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>Conversational AI</CardTitle>
                <CardDescription>Chat with HariumAI to get answers, ideas, and more.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChatPanel />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="image">
            <Card>
              <CardHeader>
                <CardTitle>Image Generation</CardTitle>
                <CardDescription>Create stunning images from text prompts.</CardDescription>
              </CardHeader>
              <CardContent>
                <ImagePanel />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
