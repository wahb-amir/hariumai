
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { HariumAiLayout } from '@/components/harium-ai-layout';
import { ChatPanel } from '@/components/chat-panel';
import { getSession } from '@/services/chat-history';

export default function ChatPage() {
  const params = useParams();
  const id = params.id as string;
  const [model, setModel] = useState('1.2ot');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionData = async () => {
        if (id) {
            const session = await getSession(id);
            if (session && session.model) {
                setModel(session.model);
            }
        }
        setLoading(false);
    }
    fetchSessionData();
  }, [id]);


  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <HariumAiLayout model={model} onModelChange={setModel}>
        <ChatPanel key={id} chatId={id} model={model} />
    </HariumAiLayout>
  );
}
