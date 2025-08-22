
"use client";

import { useState } from 'react';
import { HariumAiLayout } from '@/components/harium-ai-layout';
import { ChatPanel, type ChatMode } from '@/components/chat-panel';

export default function Home() {
  const [model, setModel] = useState('1.2ot');
  const [chatMode, setChatMode] = useState<ChatMode>('chit-chat');
  
  return (
    <HariumAiLayout 
      model={model} 
      onModelChange={setModel} 
      chatMode={chatMode} 
      onChatModeChange={setChatMode}
    >
        <ChatPanel model={model} chatMode={chatMode} onChatModeChange={setChatMode} />
    </HariumAiLayout>
  );
}
