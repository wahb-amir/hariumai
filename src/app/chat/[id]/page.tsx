import { HariumAiLayout } from '@/components/harium-ai-layout';
import { ChatPanel } from '@/components/chat-panel';

export default function ChatPage({ params }: { params: { id: string } }) {
  return (
    <HariumAiLayout>
        <ChatPanel key={params.id} chatId={params.id} />
    </HariumAiLayout>
  );
}
