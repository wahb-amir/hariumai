"use client"

import * as React from "react"
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
} from "@/components/ui/sidebar"
import {
    Plus,
    Users,
    VolumeX,
    User as UserIcon,
    LogOut,
    Cog,
    Menu,
    Sparkles,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ChatPanel } from "./chat-panel"

export function HariumAiLayout() {
  const [voiceResponses, setVoiceResponses] = React.useState(false)

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                    <AvatarFallback className="bg-primary text-primary-foreground"><Sparkles className="h-5 w-5" /></AvatarFallback>
                </Avatar>
                <h1 className="text-lg font-semibold">HariumAI</h1>
            </div>
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
                <SidebarGroup>
                    <SidebarGroupLabel>Chat Options</SidebarGroupLabel>
                    <SidebarMenuItem>
                        <SidebarMenuButton isActive>
                            <Plus />
                            New AI Chat
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton>
                            <Users />
                            Live Group Chat (Coming Soon)
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarGroup>
                <SidebarSeparator />
                <SidebarGroup>
                    <SidebarGroupLabel>Accessibility</SidebarGroupLabel>
                    <SidebarMenuItem>
                        <div className="flex items-center justify-between w-full p-2">
                            <div className="flex items-center gap-2">
                                <VolumeX />
                                <span className="text-sm">Voice Responses</span>
                            </div>
                            <Switch checked={voiceResponses} onCheckedChange={setVoiceResponses} />
                        </div>
                    </SidebarMenuItem>
                </SidebarGroup>
                <SidebarSeparator />
                 <SidebarGroup>
                    <SidebarGroupLabel>Profile</SidebarGroupLabel>
                    <SidebarMenuItem>
                        <SidebarMenuButton>
                            <UserIcon />
                            Edit Profile
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton>
                            <LogOut />
                            Logout
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarGroup>
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu>
                 <SidebarGroup>
                    <SidebarGroupLabel>AI Model</SidebarGroupLabel>
                     <SidebarMenuItem>
                        <SidebarMenuButton>
                            <Cog />
                            ha-1.1
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarGroup>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm z-10">
             <div className="flex items-center gap-2">
                <SidebarTrigger>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu />
                    </Button>
                </SidebarTrigger>
                <h2 className="font-bold text-lg">Harium AI <span className="text-xs text-muted-foreground font-normal">(ha-1.4)</span></h2>
             </div>
             <div className="flex items-center gap-2">
                <Button>Publish</Button>
                 <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">A</AvatarFallback>
                </Avatar>
             </div>
        </header>
        <main className="flex-1">
            <ChatPanel />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
