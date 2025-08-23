
"use client";

import * as React from "react";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarInset,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import {
  Users,
  Volume2,
  User as UserIcon,
  LogOut,
  Cog,
  Menu,
  Moon,
  MessageSquare,
  Image as ImageIcon,
  LogIn,
  PlusCircle,
  History,
  ChevronDown,
  MoreVertical,
  Search,
  BrainCircuit,
  Phone,
  Trash2,
  Edit,
  Delete,
  Clapperboard,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { HariumLogo } from "./harium-logo";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { getAuth, signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { app } from "@/lib/firebase";
import { getChatSessions } from "@/ai/flows/get-chat-sessions";
import { renameChatSession } from "@/ai/flows/rename-chat-session";
import { deleteChatSession } from "@/ai/flows/delete-chat-session";
import { deleteAllChatSessions } from "@/ai/flows/delete-all-chat-sessions";
import type { GetChatSessionsOutput } from "@/ai/flows/get-chat-sessions";
import { v4 as uuidv4 } from "uuid";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "./ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { type ChatMode } from "./chat-panel";
import { cn } from "@/lib/utils";
import { CallPanel } from "./call-panel";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

type HariumAiLayoutClientProps = {
    children?: React.ReactNode;
    model: string;
    onModelChange: (model: string) => void;
    chatMode: ChatMode;
    onChatModeChange: (mode: ChatMode) => void;
    voiceResponses: boolean;
    onVoiceResponsesChange: (enabled: boolean) => void;
    isRecording: boolean;
    onToggleRecording: () => void;
    isCallActive: boolean;
    onToggleCall: () => void;
}

const voices = [
    { id: 'Algenib', name: 'Algenib (Female)' },
    { id: 'Achernar', name: 'Achernar (Male)' },
    { id: 'Umbriel', name: 'Umbriel (Female)' },
    { id: 'Gacrux', name: 'Gacrux (Male)' },
    { id: 'Leda', name: 'Leda (Female)' },
];


function HariumAiLayoutClient({ 
    children, model, onModelChange, chatMode, onChatModeChange, 
    voiceResponses, onVoiceResponsesChange, isRecording, onToggleRecording,
    isCallActive, onToggleCall
}: HariumAiLayoutClientProps) {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [chatSessions, setChatSessions] = React.useState<GetChatSessionsOutput>([]);
  const [renameTarget, setRenameTarget] = React.useState<{ id: string; title: string } | null>(null);
  const [newTitle, setNewTitle] = React.useState("");
  const [isVoiceSelectionOpen, setIsVoiceSelectionOpen] = React.useState(false);
  const [selectedVoice, setSelectedVoice] = React.useState('Algenib');

  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const savedVoice = localStorage.getItem('selected_voice');
    if (savedVoice) {
        setSelectedVoice(savedVoice);
    }
  }, []);

  React.useEffect(() => {
    if (!authLoading) {
      let currentUserId = user?.uid;
      if (!currentUserId) {
        currentUserId = localStorage.getItem('anonymous_user_id') || uuidv4();
        localStorage.setItem('anonymous_user_id', currentUserId);
      }
      setUserId(currentUserId);
    }
  }, [user, authLoading]);

  const fetchSessions = React.useCallback(async () => {
    if (userId) {
      try {
        const sessions = await getChatSessions({ userId });
        setChatSessions(sessions);
      } catch (error) {
        console.error("Failed to fetch chat sessions:", error);
      }
    }
  }, [userId]);

  React.useEffect(() => {
    fetchSessions();
    const handleChatUpdated = () => {
      fetchSessions();
    };
    window.addEventListener('chat-updated', handleChatUpdated);
    return () => {
        window.removeEventListener('chat-updated', handleChatUpdated);
    };
  }, [userId, fetchSessions]);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const handleLogout = async () => {
    try {
        if (app) {
            const auth = getAuth(app);
            await signOut(auth);
            toast({
                title: 'Signed Out',
                description: 'You have been successfully signed out.'
            });
            localStorage.removeItem('anonymous_user_id');
            localStorage.removeItem('selected_voice');
            setChatSessions([]);
            router.push('/login');
        }
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to sign out.'
        })
    }
  }

  const handleModelChange = (newModel: string) => {
    if (onModelChange) {
        onModelChange(newModel);
    }
    toast({
        title: "Model Switched",
        description: `Switched to ${newModel}`,
    });
    router.push('/');
  }

  const handleSetMode = (mode: ChatMode) => {
    onChatModeChange(mode);
    if (pathname !== '/') {
        router.push('/');
    }
  }

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !newTitle.trim() || !userId) return;

    try {
        await renameChatSession({ sessionId: renameTarget.id, userId, newTitle: newTitle.trim() });
        toast({ title: "Chat Renamed", description: `"${renameTarget.title}" has been renamed to "${newTitle.trim()}".` });
        fetchSessions();
    } catch (error) {
        console.error("Failed to rename session", error);
        toast({ variant: "destructive", title: "Error", description: "Could not rename the chat session." });
    } finally {
        setRenameTarget(null);
        setNewTitle("");
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!userId) return;
    try {
        await deleteChatSession({ sessionId, userId });
        toast({ title: "Chat Deleted", description: "The chat session has been deleted." });
        if (pathname === `/chat/${sessionId}`) {
            router.push('/');
        }
        fetchSessions();
    } catch (error) {
        console.error("Failed to delete session", error);
        toast({ variant: "destructive", title: "Error", description: "Could not delete the chat session." });
    }
  };

  const handleDeleteAll = async () => {
    if (!userId) return;
    try {
        await deleteAllChatSessions({ userId });
        toast({ title: "All Chats Deleted", description: "All of your chat sessions have been deleted." });
        if (pathname.startsWith('/chat/')) {
            router.push('/');
        }
        fetchSessions();
    } catch (error) {
        console.error("Failed to delete all sessions", error);
        toast({ variant: "destructive", title: "Error", description: "Could not delete all chat sessions." });
    }
  }

  const handleToggleCall = () => {
     if (isCallActive) {
        onToggleCall(); // Directly turn off if already active
     } else {
        const hasSelectedVoice = !!localStorage.getItem('selected_voice');
        if (hasSelectedVoice) {
            onToggleCall();
        } else {
            setIsVoiceSelectionOpen(true);
        }
     }
  }

  const handleSaveVoiceSelection = () => {
    localStorage.setItem('selected_voice', selectedVoice);
    toast({ title: 'Voice Saved', description: 'Your preferred voice has been set.' });
    setIsVoiceSelectionOpen(false);
    onToggleCall();
  }

  const mainContent = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // @ts-ignore
      return React.cloneElement(child, { model, chatMode, onChatModeChange, voiceResponses, onToggleRecording, isRecording, isCallActive });
    }
    return child;
  });

  const models = ["ha 1.1", "1.2ot", "1.2otpro", "1.3 (In Testing)"];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <HariumLogo />
            <h1 className="text-lg font-black">HariumAI</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarGroup>
                <SidebarMenuItem>
                    <Link href="/" className="w-full">
                        <SidebarMenuButton>
                        <PlusCircle />
                        New Chat
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
                <div className="flex items-center justify-between pl-2 pr-1">
                    <SidebarGroupLabel className="flex items-center gap-2 !p-0"><History className="h-4 w-4" />Recent Chats</SidebarGroupLabel>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={chatSessions.length === 0}>
                                <Delete className="h-4 w-4" />
                                <span className="sr-only">Delete All Chats</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete all your chat sessions.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteAll}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
              {chatSessions.map(session => (
                 <SidebarMenuItem key={session.sessionId}>
                    <Link href={`/chat/${session.sessionId}`} className="w-full">
                        <SidebarMenuButton isActive={pathname === `/chat/${session.sessionId}`}>
                            <MessageSquare />
                            <span className="truncate">{session.title}</span>
                        </SidebarMenuButton>
                    </Link>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                             <SidebarMenuAction showOnHover>
                                <MoreVertical />
                                <span className="sr-only">Chat Options</span>
                            </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DialogTrigger asChild onSelect={(e) => e.preventDefault()}>
                                <DropdownMenuItem onSelect={() => {setRenameTarget({id: session.sessionId, title: session.title}); setNewTitle(session.title)}}>
                                    <Edit className="mr-2" />
                                    Rename
                                </DropdownMenuItem>
                            </DialogTrigger>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="mr-2 text-red-500" />
                                        <span className="text-red-500">Delete</span>
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                     <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete the chat "{session.title}". This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(session.sessionId)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Features</SidebarGroupLabel>
              <SidebarMenuItem>
                 <Link href="/generation/image" className="w-full">
                    <SidebarMenuButton isActive={pathname === '/generation/image'}>
                      <ImageIcon />
                      Image Generation
                    </SidebarMenuButton>
                  </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <Users />
                  Live Group Chat (Coming Soon)
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Accessibility</SidebarGroupLabel>
              <SidebarMenuItem>
                <div className="flex items-center justify-between w-full p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <span>Voice Responses</span>
                  </div>
                  <Switch
                    checked={voiceResponses}
                    onCheckedChange={onVoiceResponsesChange}
                    disabled={isCallActive}
                  />
                </div>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <div className="flex items-center justify-between w-full p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    <span>Dark Mode</span>
                  </div>
                  <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
                </div>
              </SidebarMenuItem>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Profile</SidebarGroupLabel>
              {user ? (
                <>
                <SidebarMenuItem>
                    <SidebarMenuButton>
                    <UserIcon />
                    <span className="truncate">{user.displayName || user.email}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout}>
                    <LogOut />
                    Logout
                    </SidebarMenuButton>
                </SidebarMenuItem>
                </>
              ) : (
                <SidebarMenuItem>
                    <Link href="/login" className="w-full">
                        <SidebarMenuButton>
                            <LogIn />
                            Login
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
              )}
            </SidebarGroup>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
        </SidebarFooter>
      </Sidebar>
      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Rename Chat</DialogTitle>
                <DialogDescription>
                    Enter a new title for your chat session.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRename}>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                            Title
                        </Label>
                        <Input
                            id="title"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Save changes</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
     <Dialog open={isVoiceSelectionOpen} onOpenChange={setIsVoiceSelectionOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Select a Voice</DialogTitle>
                <DialogDescription>
                    Choose the voice you'd like Harium AI to use for conversations.
                </DialogDescription>
            </DialogHeader>
            <RadioGroup defaultValue={selectedVoice} onValueChange={setSelectedVoice} className="grid gap-4 py-4">
                {voices.map((voice) => (
                    <div key={voice.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={voice.id} id={voice.id} />
                        <Label htmlFor={voice.id}>{voice.name}</Label>
                    </div>
                ))}
            </RadioGroup>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="button" onClick={handleSaveVoiceSelection}>Start Call</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
      <SidebarInset>
        <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden">
              <Menu />
            </SidebarTrigger>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-1 h-auto font-black text-lg">
                        Harium AI{" "}
                        <span className="text-xs text-muted-foreground font-normal ml-2">
                            ({model})
                        </span>
                        <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {models.map(m => (
                        <DropdownMenuItem key={m} onSelect={() => handleModelChange(m)} disabled={m === model}>
                            {m}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleToggleCall}
                className={cn(isCallActive && "text-red-500 hover:text-red-600 bg-red-500/10")}
                title="Start/End Live Call"
            >
                <Phone className="h-5 w-5" />
                <span className="sr-only">Toggle Live Call</span>
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                        <span className="sr-only">Options</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>AI Modes</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={chatMode === 'chit-chat'} onSelect={() => handleSetMode('chit-chat')}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span>Chit Chatting</span>
                    </DropdownMenuCheckboxItem>
                     <DropdownMenuCheckboxItem checked={chatMode === 'search-web'} onSelect={() => handleSetMode('search-web')}>
                        <Search className="mr-2 h-4 w-4" />
                        <span>Search Web</span>
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={chatMode === 'deep-research'} onSelect={() => handleSetMode('deep-research')}>
                        <BrainCircuit className="mr-2 h-4 w-4" />
                        <span>Deep Research</span>
                    </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 flex flex-col relative">
          {isCallActive && (
            <CallPanel 
                isMuted={!isRecording}
                onToggleMute={onToggleRecording}
                onToggleSpeaker={onVoiceResponsesChange}
                isSpeakerOn={voiceResponses}
                onEndCall={onToggleCall}
            />
          )}
          {mainContent}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}


type HariumAiLayoutProps = {
    children?: React.ReactNode;
    model: string;
    onModelChange: (model: string) => void;
    chatMode: ChatMode;
    onChatModeChange: (mode: ChatMode) => void;
};

export function HariumAiLayout({ children, model, onModelChange, chatMode, onChatModeChange }: HariumAiLayoutProps) {
    const [voiceResponses, setVoiceResponses] = React.useState(true); // Default to on
    const [isRecording, setIsRecording] = React.useState(false);
    const [isCallActive, setIsCallActive] = React.useState(false);

    const handleToggleRecording = () => {
        setIsRecording(prev => !prev);
    };

    const handleToggleCall = () => {
        const newCallState = !isCallActive;
        setIsCallActive(newCallState);
        setVoiceResponses(newCallState); // Voice must be on for a call
        if (!newCallState && isRecording) {
            setIsRecording(false); // Stop recording if call ends
        }
    };

    return (
        <AuthProvider>
            <HariumAiLayoutClient 
                model={model} 
                onModelChange={onModelChange} 
                chatMode={chatMode} 
                onChatModeChange={onChatModeChange}
                voiceResponses={voiceResponses}
                onVoiceResponsesChange={setVoiceResponses}
                isRecording={isRecording}
                onToggleRecording={handleToggleRecording}
                isCallActive={isCallActive}
                onToggleCall={handleToggleCall}
            >
                {children}
            </HariumAiLayoutClient>
        </AuthProvider>
    )
}
