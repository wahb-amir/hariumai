import { HariumAiLayout } from '@/components/harium-ai-layout';

export default function Home({ params }: { params: { id?: string }}) {
  return <HariumAiLayout key={params.id} />;
}
