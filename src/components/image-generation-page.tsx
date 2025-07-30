import { HariumAiLayout } from '@/components/harium-ai-layout';
import { ImageGenerationPanel } from './image-generation-panel';

export function ImageGenerationPage() {
  return (
    <HariumAiLayout>
      <div className="p-4">
        <ImageGenerationPanel />
      </div>
    </HariumAiLayout>
  );
}
