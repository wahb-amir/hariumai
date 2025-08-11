
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Volume2, Send, Loader2, Mic, Paperclip, ImageIcon, Copy, RefreshCw, MoreVertical, Search, MessageSquare, BrainCircuit, Globe, File, Link2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { converseWithAi } from "@/ai/flows/generate-conversation";
import { convertTextToSpeech } from "@/ai/flows/convert-text-to-speech";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { HariumLogo } from "./harium-logo";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getChatHistory } from "@/ai/flows/get-chat-history";
import { v4 as uuidv4 } from 'uuid';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { WebSearchEnablingLoader } from "./web-search-loader";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  type: "text" | "image" | "harium-browser";
  attachment?: {
    name: string;
    type: string;
    size: number;
    dataUrl: string;
  }
};

export type ChatMode = "chit-chat" | "search-web" | "deep-research";

type ChatPanelProps = {
    chatId?: string;
    model?: string;
    chatMode: ChatMode;
    onChatModeChange: (mode: ChatMode) => void;
}

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
    if (!text) {
        return null;
    }
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

function HariumBrowser({ query, answer }: { query: string, answer?: string }) {
    const [displayedQuery, setDisplayedQuery] = useState("");
    const [status, setStatus] = useState<"typing" | "searching" | "finding" | "complete">("typing");

    useEffect(() => {
        if (answer) {
            setStatus("complete");
            return;
        }

        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < query.length) {
                setDisplayedQuery((prev) => prev + query.charAt(i));
                i++;
            } else {
                clearInterval(typingInterval);
                setTimeout(() => setStatus("searching"), 500);
                setTimeout(() => setStatus("finding"), 2000);
            }
        }, 50);

        return () => clearInterval(typingInterval);
    }, [query, answer]);

    const statusText = {
        typing: <span className="text-muted-foreground">{displayedQuery}<span className="animate-pulse">|</span></span>,
        searching: <span className="text-foreground">Searching...</span>,
        finding: <span className="text-foreground">Finding best results...</span>,
        complete: <span className="text-foreground">{query}</span>
    }[status];

    return (
        <div className="flex items-start gap-4">
            <Avatar className="h-8 w-8 border-none bg-transparent">
                <AvatarFallback className="bg-transparent text-transparent">
                    <HariumLogo className="h-8 w-8" />
                </AvatarFallback>
            </Avatar>
            <div className="w-full max-w-3xl rounded-lg bg-card border shadow-sm animate-in fade-in-50">
                <div className="h-9 flex items-center px-3 border-b">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div>
                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500"></div>
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex-1 text-center text-xs font-medium text-muted-foreground">
                        Harium Browser
                    </div>
                </div>
                <div className="p-3 border-b">
                    <div className="flex items-center gap-2 rounded-md bg-secondary px-3 h-8 text-sm">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        {statusText}
                    </div>
                </div>
                 <div className="p-4 bg-background">
                    {status !== 'complete' ? (
                         <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Skeleton className="h-4 w-4 rounded-full" />
                                <Skeleton className="h-4 w-[250px]" />
                            </div>
                            <Skeleton className="h-4 w-[90%]" />
                            <Skeleton className="h-4 w-[80%]" />
                         </div>
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <MarkdownRenderer text={answer || ""} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function ChatPanel({ chatId, model, chatMode, onChatModeChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [preparingSearch, setPreparingSearch] = useState(false);
  const [attachment, setAttachment] = useState<Message['attachment'] | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [currentSessionId, setCurrentSessionId] = useState(chatId || uuidv4());

  useEffect(() => {
    if (chatId) {
      setCurrentSessionId(chatId);
    } else {
      // For a new chat, check the chatMode and trigger the loader if needed.
      if (chatMode === 'search-web' && messages.length === 0) {
        setPreparingSearch(true);
      } else {
        setPreparingSearch(false);
      }
    }
  }, [chatId, chatMode, messages.length]);


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
                const history = await getChatHistory({ sessionId: chatId });
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

  const handleSendMessage = async (e: React.FormEvent, promptOverride?: string) => {
    e.preventDefault();
    const currentInput = promptOverride || input;
    if (!currentInput.trim() || !userId) return;

    const isNewChat = !chatId;
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: currentInput,
      type: 'text',
      attachment: attachment || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);

    if (!promptOverride) {
      setInput('');
      setAttachment(null);
    }
    setIsLoading(true);
    
    let assistantMessageId: string | null = null;
    if (chatMode === 'search-web') {
        const browserMessage: Message = {
            id: `asst-${Date.now()}`,
            role: 'assistant',
            content: currentInput, // Pass query to browser animation
            type: 'harium-browser',
        };
        assistantMessageId = browserMessage.id;
        setMessages((prev) => [...prev, browserMessage]);
    }

    try {
      const result = await converseWithAi({
        prompt: currentInput,
        sessionId: currentSessionId,
        userId,
        chatMode,
        model,
        attachmentDataUri: attachment?.dataUrl
      });

      const assistantMessage: Message = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: result.response,
        type: result.responseType,
      };

      if (isNewChat && result.newSessionId) {
        router.push(`/chat/${result.newSessionId}`);
      } else {
          if (chatMode === 'search-web' && assistantMessageId) {
            // Update the browser message with the final answer
            setMessages((prev) => prev.map(msg => 
                msg.id === assistantMessageId 
                ? { ...msg, content: result.response } 
                : msg
            ));
          } else {
            setMessages((prev) => [...prev, assistantMessage]);
          }
      }
    } catch (error) {
      console.error('Error in conversation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get a response from the AI.',
      });
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (messages.length < 1 || isLoading) return;
    const lastUserMessage = messages.filter(m => m.role === 'user').at(-1);
    if(lastUserMessage) {
        const lastMessage = messages.at(-1);
        // If the last message was a browser result, remove both it and the user message
        const messagesToRemove = (lastMessage?.type === 'harium-browser' || lastMessage?.role === 'assistant') ? 2 : 1;
        const newMessages = messages.slice(0, messages.length - messagesToRemove);
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

  const handleAttachment = (type: 'gallery' | 'files') => {
    if (fileInputRef.current) {
        fileInputRef.current.accept = type === 'gallery' ? 'image/*' : 'image/*'; // Allow only images for now
        fileInputRef.current.click();
    }
  }

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
            variant: "destructive",
            title: "Invalid File Type",
            description: "Please select an image file.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const dataUrl = loadEvent.target?.result as string;
        
        setAttachment({
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: dataUrl,
        });

        toast({
            title: "Attachment Ready",
            description: `${file.name} is ready to be sent with your next message.`,
        });
      }
      reader.readAsDataURL(file);
    }
     // Reset file input
     if(e.target) {
        e.target.value = '';
    }
  }

    const renderInitialScreen = () => {
        if (messages.length === 0 && !isLoading) {
             if (chatMode === 'search-web' && preparingSearch) {
                return (
                    <div className="flex flex-col items-center justify-center h-full pt-24">
                        <WebSearchEnablingLoader onComplete={() => setPreparingSearch(false)} />
                    </div>
                );
            }
            if (chatMode === 'search-web' && !preparingSearch) {
                return (
                    <div className="flex flex-col items-center justify-center h-full pt-24 text-center">
                         <Search className="h-24 w-24" />
                         <h2 className="mt-6 text-2xl font-black">Search Web</h2>
                         <p className="text-muted-foreground">Ask me anything to search across the web.</p>
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
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelected} />
        
      <ScrollArea className="flex-1 pr-4 -mr-4">
        <div className="space-y-6 max-w-3xl mx-auto py-8">
            {renderInitialScreen()}
          {messages.map((message, index) => (
            <div key={message.id}>
                {message.type === 'harium-browser' ? (
                     <HariumBrowser query={messages.find(m => m.role === 'user')?.content || ''} answer={message.content} />
                ) : (
                    <div className={cn("flex items-start gap-4", message.role === "user" && "justify-end")}>
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
                            <>
                                {message.attachment && (
                                    <div className="flex items-center gap-2 p-2 rounded-md bg-background/50 mb-2">
                                        {message.attachment.type.startsWith('image/') ? (
                                            <Image src={message.attachment.dataUrl} alt={message.attachment.name} width={48} height={48} className="rounded-md" />
                                        ) : (
                                            <File className="h-6 w-6" />
                                        )}
                                        <div className="text-sm">
                                            <p className="font-semibold">{message.attachment.name}</p>
                                            <p className="text-xs">{Math.round(message.attachment.size / 1024)} KB</p>
                                        </div>
                                    </div>
                                )}
                                <div className="text-sm leading-relaxed break-words">
                                    {message.role === 'assistant' && !isLoading && index === messages.length - 1 ? (
                                        <Typewriter text={message.content} />
                                    ) : (
                                        <MarkdownRenderer text={message.content} />
                                    )}
                                </div>
                            </>
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
                )}
            </div>
          ))}
           {isLoading && messages.length > 0 && messages.at(-1)?.type !== 'harium-browser' && (
            <>
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
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="border-t pt-4 bg-background">
        <div className="max-w-3xl mx-auto">
             {attachment && (
                <div className="px-4 pb-2">
                    <div className="flex items-center gap-2 p-2 rounded-md bg-secondary text-sm">
                        <ImageIcon className="h-5 w-5" />
                        <span className="font-medium truncate">{attachment.name}</span>
                        <span className="text-muted-foreground text-xs">({Math.round(attachment.size / 1024)} KB)</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setAttachment(null)}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove attachment</span>
                        </Button>
                    </div>
                </div>
            )}
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" disabled={isLoading}>
                                <Paperclip className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleAttachment('gallery')}>
                                <ImageIcon className="mr-2 h-4 w-4" />
                                <span>Gallery</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleAttachment('files')}>
                                <File className="mr-2 h-4 w-4" />
                                <span>Files</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>
                                <Link2 className="mr-2 h-4 w-4" />
                                <span>Attach URL (in testing)</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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

    