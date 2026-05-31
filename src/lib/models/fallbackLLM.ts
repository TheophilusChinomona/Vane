import z from 'zod';
import BaseLLM from './base/llm';
import {
  GenerateObjectInput,
  GenerateTextInput,
  GenerateTextOutput,
  StreamTextOutput,
} from './types';

const isRetryable = (err: any): boolean => {
  const status = err?.status ?? err?.statusCode ?? err?.response?.status;
  if (status === undefined) return true; // network / timeout
  if (status >= 500 && status <= 599) return true;
  if (status === 408 || status === 409 || status === 429) return true;
  return false;
};

class FallbackLLM extends BaseLLM<undefined> {
  private llms: BaseLLM<any>[];

  constructor(llms: BaseLLM<any>[]) {
    super(undefined);
    this.llms = llms;
  }

  private async run<T>(fn: (llm: BaseLLM<any>) => Promise<T>): Promise<T> {
    let lastError: any;
    for (const llm of this.llms) {
      try {
        return await fn(llm);
      } catch (err) {
        if (!isRetryable(err)) throw err;
        lastError = err;
      }
    }
    throw lastError;
  }

  // Once the first chunk has been yielded we cannot restart — re-throw immediately.
  private async *stream<T>(
    fn: (llm: BaseLLM<any>) => AsyncGenerator<T>,
  ): AsyncGenerator<T> {
    let lastError: any;
    for (const llm of this.llms) {
      let started = false;
      try {
        for await (const chunk of fn(llm)) {
          started = true;
          yield chunk;
        }
        return;
      } catch (err) {
        if (started || !isRetryable(err)) throw err;
        lastError = err;
      }
    }
    throw lastError;
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    return this.run((llm) => llm.generateText(input));
  }

  async *streamText(input: GenerateTextInput): AsyncGenerator<StreamTextOutput> {
    yield* this.stream((llm) => llm.streamText(input));
  }

  async generateObject<T>(input: GenerateObjectInput): Promise<z.infer<T>> {
    return this.run((llm) => llm.generateObject<T>(input));
  }

  async *streamObject<T>(
    input: GenerateObjectInput,
  ): AsyncGenerator<Partial<z.infer<T>>> {
    yield* this.stream((llm) => llm.streamObject<T>(input));
  }
}

export default FallbackLLM;
