import { Module } from "@nestjs/common";
import { IdeasController } from "./ideas.controller";
import { IdeasService } from "./ideas.service";
import { OpenAiEmbeddingsService } from "./embeddings/openai-embeddings.service";

@Module({
  controllers: [IdeasController],
  providers: [IdeasService, OpenAiEmbeddingsService],
})
export class IdeasModule {}
