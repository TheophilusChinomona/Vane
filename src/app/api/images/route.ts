import searchImages from '@/lib/agents/media/image';
import ModelRegistry from '@/lib/models/registry';
import { ModelWithProvider } from '@/lib/models/types';
import FallbackLLM from '@/lib/models/fallbackLLM';

interface ImageSearchBody {
  query: string;
  chatHistory: any[];
  chatModel: ModelWithProvider;
  fallbackModels?: ModelWithProvider[];
}

export const POST = async (req: Request) => {
  try {
    const body: ImageSearchBody = await req.json();

    const registry = new ModelRegistry();

    const llm = await registry.loadChatModel(
      body.chatModel.providerId,
      body.chatModel.key,
    );

    const fallbacks = await Promise.all(
      (body.fallbackModels ?? []).map(f => registry.loadChatModel(f.providerId, f.key))
    );
    const chatLlm = fallbacks.length > 0 ? new FallbackLLM([llm, ...fallbacks]) : llm;

    const images = await searchImages(
      {
        chatHistory: body.chatHistory.map(([role, content]) => ({
          role: role === 'human' ? 'user' : 'assistant',
          content,
        })),
        query: body.query,
      },
      chatLlm,
    );

    return Response.json({ images }, { status: 200 });
  } catch (err) {
    console.error(`An error occurred while searching images: ${err}`);
    return Response.json(
      { message: 'An error occurred while searching images' },
      { status: 500 },
    );
  }
};
