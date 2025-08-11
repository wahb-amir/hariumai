
"use client";

import { useState } from 'react';
import { HariumAiLayout } from '@/components/harium-ai-layout';
import { ChatPanel } from '@/components/chat-panel';

export default function Home() {
  const [model, setModel] = useState('1.2ot');
  
  return (
    <HariumAiLayout model={model} onModelChange={setModel}>
        <ChatPanel model={model} />
    </HariumAiLayout>
  );
}
