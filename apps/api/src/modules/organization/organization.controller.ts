import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";
import { OrganizationService } from "./organization.service.js";

@Controller()
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get("me/factories")
  factories(@CurrentUser() user: RequestUser) {
    return this.organizationService.getFactories(user);
  }

  @Post("me/switch-factory")
  switchFactory(@CurrentUser() user: RequestUser, @Body() body: { factoryId: string }) {
    return this.organizationService.switchFactory(user, body.factoryId);
  }

  @Get("organizations")
  organizations(@CurrentUser() user: RequestUser) {
    return this.organizationService.getOrganizations(user);
  }

  @Get("factories")
  factoriesList(@CurrentUser() user: RequestUser) {
    return this.organizationService.getFactories(user);
  }
}
