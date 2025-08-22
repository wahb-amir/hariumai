"use client";

import { VideoGenerationPanel } from '@/components/video-generation-panel';
import { HariumAiLayout } from '@/components/harium-ai-layout';
import { useState } from 'react';
import type { ChatMode } from '@/components/chat-panel';

export default function VideoPage() {
  const [model, setModel] = useState('1.2ot');
  const [chatMode, setChatMode] = useState<ChatMode>('chit-chat');

  return (
    <HariumAiLayout model={model} onModelChange={setModel} chatMode={chatMode} onChatModeChange={setChatMode}>
        <VideoGenerationPanel />
    </HariumAiLayout>
  );
}
