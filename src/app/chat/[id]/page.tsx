
"use client";

import { useState, useEffect } from 'react';
import { HariumAiLayout } from '@/components/harium-ai-layout';
import { ChatPanel } from '@/components/chat-panel';
import { getSession } from '@/services/chat-history';

export default function ChatPage({ params }: { params: { id: string } }) {
  const [model, setModel] = useState('1.2ot');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionData = async () => {
        const session = await getSession(params.id);
        if (session && session.model) {
            setModel(session.model);
        }
        setLoading(false);
    }
    fetchSessionData();
  }, [params.id]);


  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <HariumAiLayout model={model} onModelChange={setModel}>
        <ChatPanel key={params.id} chatId={params.id} model={model} />
    </HariumAiLayout>
  );
}
