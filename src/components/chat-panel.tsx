
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Volume2, Send, Loader2, Mic, Paperclip, ImageIcon, Copy, RefreshCw, MoreVertical, Search, MessageSquare, BrainCircuit, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { converseWithAi } from "@/ai/flows/generate-conversation";
import { convertTextToSpeech } from "@/ai/flows/convert-text-to-speech";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { HariumLogo } from "./harium-logo";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getChatHistory } from "@/ai/flows/get-chat-history";
import { getSession } from "@/services/chat-history";
import { v4 as uuidv4 } from 'uuid';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  type: "text" | "image";
};

type ChatPanelProps = {
    chatId?: string;
    model?: string;
}

type ChatMode = "chit-chat" | "search-web" | "deep-research";

type SearchStage = "google" | "facebook" | "web" | null;

const CodeBlock = ({ code }: { code: string }) => {
    const { toast } = useToast();
    const handleCopy = () => {
      navigator.clipboard.writeText(code);
      toast({
        title: "Copied!",
        description: "The code has been copied to your clipboard.",
      });
    };
  
    return (
      <div className="bg-black/80 text-white rounded-lg my-2 relative max-w-full">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-white/70 hover:text-white absolute top-2 right-2"
          onClick={handleCopy}
          title="Copy code"
        >
          <Copy className="h-4 w-4" />
          <span className="sr-only">Copy code</span>
        </Button>
        <pre className="p-4 overflow-x-auto text-sm">
          <code>{code}</code>
        </pre>
      </div>
    );
};

const MarkdownRenderer = ({ text }: { text: string }) => {
    const renderChunk = (chunk: string, index: number) => {
        if (chunk.startsWith('```') && chunk.endsWith('```')) {
            const code = chunk.slice(3, -3).trim();
            return <CodeBlock key={index} code={code} />;
        }
      // Bold
      if (chunk.startsWith('**') && chunk.endsWith('**')) {
        return <strong key={index}>{chunk.slice(2, -2)}</strong>;
      }
      // Italic
      if (chunk.startsWith('_') && chunk.endsWith('_')) {
        return <em key={index}>{chunk.slice(1, -1)}</em>;
      }
      // Blockquote
      if (chunk.startsWith('>')) {
        return (
          <blockquote key={index} className="pl-4 border-l-4 border-gray-300 italic my-2">
            {chunk.slice(1).trim()}
          </blockquote>
        );
      }
       // Link for "Chohan Space"
       if (chunk.toLowerCase() === 'chohan space') {
        return (
          <a
            key={index}
            href="https://thechohan.space"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {chunk}
          </a>
        );
      }
      return <span key={index}>{chunk}</span>;
    };
  
    const parts = text.split(/(\`\`\`[\s\S]*?\`\`\`|\*\*.*?\*\*|_.*?_|> .*|Chohan Space)/gi).filter(Boolean);
    
    return <>{parts.map(renderChunk)}</>;
};

function Typewriter({ text }: { text: string }) {
    const [displayedText, setDisplayedText] = useState("");
    const [showCursor, setShowCursor] = useState(true);
    const [isFinished, setIsFinished] = useState(false);
  
    useEffect(() => {
      setDisplayedText("");
      setIsFinished(false);
      let i = 0;
      const wordCount = text.split(' ').length;
      const typingSpeed = wordCount > 50 ? 10 : 20;
  
      const intervalId = setInterval(() => {
        if (i < text.length) {
          setDisplayedText((prev) => prev + text.charAt(i));
          i++;
        } else {
          clearInterval(intervalId);
          setIsFinished(true);
        }
      }, typingSpeed);
  
      return () => clearInterval(intervalId);
    }, [text]);
  
    useEffect(() => {
      if (isFinished) {
        const cursorInterval = setInterval(() => {
          setShowCursor((prev) => !prev);
        }, 500);
        return () => clearInterval(cursorInterval);
      }
    }, [isFinished]);
  
    if (isFinished) {
        return <div className="text-sm leading-relaxed break-words"><MarkdownRenderer text={text} /></div>;
    }
  
    return (
      <p className="text-sm leading-relaxed break-words">
        {displayedText}
        <span className={`text-xl ml-1 ${!isFinished || showCursor ? 'opacity-100' : 'opacity-0'} ${!isFinished ? '' : 'animate-pulse'}`}>●</span>
      </p>
    );
}

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const FacebookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v7.028C18.343 21.128 22 16.991 22 12z" />
    </svg>
)

function SearchWebLoader() {
    const [stage, setStage] = useState<SearchStage>("google");

    useEffect(() => {
        const timer1 = setTimeout(() => setStage("facebook"), 1000);
        const timer2 = setTimeout(() => setStage("web"), 2000);
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    return (
        <div className="flex items-start gap-4">
            <Avatar className="h-8 w-8 border-none bg-transparent">
                <AvatarFallback className="bg-transparent text-transparent">
                    <HariumLogo className="h-8 w-8" />
                </AvatarFallback>
            </Avatar>
            <div className="bg-card rounded-lg p-3 flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                {stage === "google" && <GoogleIcon />}
                {stage === "facebook" && <FacebookIcon />}
                {stage === "web" && <Globe className="h-5 w-5" />}
                <span className="text-sm text-muted-foreground">
                    {stage === "google" && "Google Search"}
                    {stage === "facebook" && "Facebook Search"}
                    {stage === "web" && "Searching the whole web"}
                </span>
            </div>
        </div>
    );
}

export function ChatPanel({ chatId, model }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>("chit-chat");
  const [preparingSearch, setPreparingSearch] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [currentSessionId, setCurrentSessionId] = useState(chatId || uuidv4());

  useEffect(() => {
    if (chatId) {
      setCurrentSessionId(chatId);
    }
  }, [chatId]);


  useEffect(() => {
    if (!authLoading) {
        let currentUserId = user?.uid;
        if (!currentUserId) {
            currentUserId = localStorage.getItem('anonymous_user_id') || uuidv4();
            localStorage.setItem('anonymous_user_id', currentUserId);
        }
        setUserId(currentUserId);
    }
  }, [user, authLoading]);

  useEffect(() => {
    const fetchHistory = async () => {
        if (chatId) {
            setIsLoading(true);
            try {
                const [history, session] = await Promise.all([
                    getChatHistory({ sessionId: chatId }),
                    getSession(chatId)
                ]);

                if (session) {
                    setChatMode(session.chatMode);
                }

                if (history.length > 0) {
                    const loadedMessages = history.map((item, index) => ({
                        id: `hist-${index}-${Date.now()}`,
                        role: item.role,
                        content: item.content,
                        type: item.content.startsWith('data:image') ? 'image' : 'text' as const, 
                    }));
                    setMessages(loadedMessages);
                } else {
                     setMessages([]);
                }
            } catch (error) {
                 console.error("Error fetching chat history:", error);
                 toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load chat history.",
                  });
            } finally {
                setIsLoading(false);
            }
        } else {
            setMessages([]);
            setIsLoading(false);
        }
    };
    fetchHistory();
  }, [chatId, toast]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSetMode = (mode: ChatMode) => {
    setChatMode(mode);
    if (mode === 'search-web' && messages.length === 0) {
        setPreparingSearch(true);
        setTimeout(() => setPreparingSearch(false), 2000);
    }
  }

  const handleSendMessage = async (e: React.FormEvent, prompt?: string) => {
    e.preventDefault();
    const currentInput = prompt || input;
    if (!currentInput.trim() || !userId) return;

    const isNewChat = !chatId;

    const userMessage: Message = { id: `user-${Date.now()}`, role: "user", content: currentInput, type: "text" };
    
    setMessages(prev => isNewChat ? [userMessage] : [...prev, userMessage]);
    
    if(!prompt) {
        setInput("");
    }
    setIsLoading(true);

    try {
        const result = await converseWithAi({ prompt: currentInput, sessionId: currentSessionId, userId, chatMode, model });
        
        if (result.responseType === 'image') {
          toast({
              title: "Image Generated",
              description: "Images are not saved in your chat history.",
          });
        }

        if (isNewChat && result.newSessionId) {
            router.push(`/chat/${result.newSessionId}`);
            return;
        }

        const assistantMessage: Message = { 
            id: `asst-${Date.now()}`, 
            role: "assistant", 
            content: result.response,
            type: result.responseType
        };
        setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error in conversation:", error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get a response from the AI.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (messages.length < 2 || isLoading) return;
    const lastUserMessage = messages.filter(m => m.role === 'user').at(-1);
    if(lastUserMessage) {
        const newMessages = messages.slice(0, -1);
        setMessages(newMessages);
        handleSendMessage(new Event('submit') as unknown as React.FormEvent, lastUserMessage.content);
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
        title: "Copied!",
        description: "The response has been copied to your clipboard.",
    });
  }

  const handlePlayAudio = async (messageId: string, text: string) => {
    if (audioPlaying === messageId) {
      audioRef.current?.pause();
      setAudioPlaying(null);
      return;
    }

    if (audioRef.current) {
        audioRef.current.pause();
    }
    setAudioPlaying(messageId);
    try {
      const { media } = await convertTextToSpeech(text);
      const audio = new Audio(media);
      audioRef.current = audio;
      audio.play();
      audio.onended = () => {
        setAudioPlaying(null);
        audioRef.current = null;
      };
      audio.onerror = () => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to play audio.",
        });
        setAudioPlaying(null);
        audioRef.current = null;
      }
    } catch (error) {
      console.error("Error converting text to speech:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate audio.",
      });
      setAudioPlaying(null);
    }
  };

    const renderInitialScreen = () => {
        if (!chatId && messages.length === 0 && !isLoading) {
            if (chatMode === 'search-web') {
                return (
                    <div className="flex flex-col items-center justify-center h-full pt-24 text-center">
                         <Search className="h-24 w-24" />
                         <h2 className="mt-6 text-2xl font-black">Search Web</h2>
                         {preparingSearch ? (
                            <div className="flex items-center gap-2 mt-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <p className="text-muted-foreground">Preparing you search web...</p>
                            </div>
                         ) : (
                            <p className="text-muted-foreground">Ask me anything to search across the web.</p>
                         )}
                    </div>
                )
            }
            if (chatMode === 'deep-research') {
                return (
                    <div className="flex flex-col items-center justify-center h-full pt-24 text-center">
                         <BrainCircuit className="h-24 w-24" />
                         <h2 className="mt-6 text-2xl font-black">Deep Research</h2>
                         <p className="text-muted-foreground">Provide a topic for in-depth analysis.</p>
                    </div>
                )
            }
            return (
                <div className="flex flex-col items-center justify-center h-full pt-24">
                    <HariumLogo className="h-24 w-24" />
                    <h2 className="mt-6 text-2xl font-black">Hey, I'm Harium.</h2>
                    <p className="text-muted-foreground">What do you want to know?</p>
                </div>
            )
        }
        return null;
    }


  return (
    <div className="flex flex-col h-full">
        <div className="flex justify-end p-2 absolute top-20 right-4 z-20">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={!!chatId}>
                        <MoreVertical className="h-5 w-5" />
                        <span className="sr-only">Options</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>AI Modes</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => handleSetMode('chit-chat')}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span>Chit Chatting</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleSetMode('search-web')}>
                        <Search className="mr-2 h-4 w-4" />
                        <span>Search Web</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleSetMode('deep-research')}>
                        <BrainCircuit className="mr-2 h-4 w-4" />
                        <span>Deep Research</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      <ScrollArea className="flex-1 pr-4 -mr-4">
        <div className="space-y-6 max-w-3xl mx-auto py-8">
            {renderInitialScreen()}
          {messages.map((message, index) => (
            <div key={message.id} className={cn("flex items-start gap-4", message.role === "user" && "justify-end")}>
              {message.role === "assistant" && (
                 <Avatar className="h-8 w-8 border-none bg-transparent">
                  <AvatarFallback className="bg-transparent text-transparent">
                    <HariumLogo className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-lg p-3",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card",
                )}
              >
                {message.type === 'image' ? (
                   <Image
                        src={message.content}
                        alt="Generated image"
                        width={512}
                        height={512}
                        className="rounded-lg"
                        data-ai-hint="generated image"
                    />
                ) : (
                    <div className="text-sm leading-relaxed break-words">
                        {message.role === 'assistant' && !isLoading && index === messages.length - 1 ? (
                            <Typewriter text={message.content} />
                        ) : (
                            <MarkdownRenderer text={message.content} />
                        )}
                    </div>
                )}
                
                {message.role === 'assistant' && !isLoading && index === messages.length - 1 && message.type === 'text' && (
                    <div className="mt-2 flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => handlePlayAudio(message.id, message.content)}
                            disabled={audioPlaying !== null && audioPlaying !== message.id}
                            title="Play audio"
                        >
                            {audioPlaying === message.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Volume2 className="h-4 w-4" />}
                            <span className="sr-only">Play audio</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => handleCopy(message.content)}
                            title="Copy response"
                        >
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy response</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={handleRegenerate}
                            disabled={isLoading}
                            title="Regenerate response"
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span className="sr-only">Regenerate response</span>
                        </Button>
                    </div>
                )}
              </div>
              {message.role === "user" && (
                 <Avatar className="h-8 w-8 border bg-background">
                    <AvatarFallback className="bg-primary text-primary-foreground"><User className="h-5 w-5" /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
           {isLoading && messages.length > 0 && (
            <>
                {chatMode === 'search-web' ? <SearchWebLoader /> : (
                    <div className="flex items-start gap-4">
                        <Avatar className="h-8 w-8 border-none bg-transparent">
                            <AvatarFallback className="bg-transparent text-transparent">
                                <HariumLogo className="h-8 w-8" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="bg-card rounded-lg p-3 flex items-center space-x-2">
                            {chatMode === 'deep-research' ? <BrainCircuit className="h-5 w-5 animate-spin" /> : <Loader2 className="h-5 w-5 animate-spin" />}
                            <span className="text-sm text-muted-foreground">
                                {chatMode === 'deep-research' ? 'Performing deep research...' : 'HariumAI is thinking...'}
                            </span>
                        </div>
                    </div>
                )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="border-t pt-4 bg-background">
        <div className="max-w-3xl mx-auto">
             <div className="h-28" />
            <form onSubmit={handleSendMessage} className="relative">
                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Send a message..."
                    className="flex-1 resize-none rounded-full bg-secondary border-none pl-4 pr-24 py-3 min-h-0 h-12"
                    rows={1}
                    onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                    }
                    }}
                    disabled={isLoading || !userId || preparingSearch}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" disabled={isLoading}><Paperclip className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" disabled={isLoading}><Mic className="h-4 w-4" /></Button>
                    <Button type="submit" size="icon" className="h-8 w-8 rounded-full" disabled={isLoading || !input.trim()}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span className="sr-only">Send</span>
                    </Button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}
