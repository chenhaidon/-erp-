import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";
import { IntegrationsService } from "./integrations.service.js";

@Controller("integrations")
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post(":system/sync")
  sync(@CurrentUser() user: RequestUser, @Param("system") system: string) {
    return this.integrationsService.triggerSync(user, system);
  }

  @Get("jobs")
  jobs(@CurrentUser() user: RequestUser) {
    return this.integrationsService.getJobs(user);
  }

  @Get("mappings")
  mappings(@CurrentUser() user: RequestUser) {
    return this.integrationsService.getMappings(user);
  }
}
