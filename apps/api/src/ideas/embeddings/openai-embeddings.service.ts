import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface OpenAiEmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
}

@Injectable()
export class OpenAiEmbeddingsService {
  private readonly logger = new Logger(OpenAiEmbeddingsService.name);
  private readonly apiKey?: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>("OPENAI_API_KEY");
    this.model =
      this.configService.get<string>("OPENAI_EMBEDDING_MODEL") ||
      "text-embedding-3-small";

    if (!this.apiKey) {
      this.logger.warn("OPENAI_API_KEY not set. Embeddings will be skipped.");
    }
  }

  async createEmbedding(text: string): Promise<number[] | null> {
    if (!this.apiKey) {
      return null;
    }

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
        encoding_format: "float",
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `OpenAI embeddings failed: ${response.status} ${errorBody}`,
      );
      return null;
    }

    const data = (await response.json()) as OpenAiEmbeddingResponse;
    return data.data?.[0]?.embedding || null;
  }
}
