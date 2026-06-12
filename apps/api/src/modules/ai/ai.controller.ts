import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";
import type { AiPromptDto } from "./dto/ai-prompt.dto.js";
import { AiService } from "./ai.service.js";

@Controller("ai")
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("ask-schedule")
  askSchedule(@CurrentUser() user: RequestUser, @Body() dto: AiPromptDto) {
    return this.aiService.askSchedule(user, dto.prompt);
  }

  @Post("analyze-root-cause")
  analyzeRootCause(@CurrentUser() user: RequestUser, @Body() dto: AiPromptDto) {
    return this.aiService.analyzeRootCause(user, dto.prompt);
  }

  @Post("generate-summary")
  generateSummary(@CurrentUser() user: RequestUser, @Body() dto: AiPromptDto) {
    return this.aiService.generateSummary(user, dto.prompt);
  }
}
