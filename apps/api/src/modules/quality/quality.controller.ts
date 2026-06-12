import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";
import { QualityService } from "./quality.service.js";
import { CreateInspectionDto, UpdateInspectionDto } from "./dto/inspection.dto.js";

@Controller()
@UseGuards(JwtAuthGuard)
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Get("inspections")
  inspections(@CurrentUser() user: RequestUser) {
    return this.qualityService.getInspections(user);
  }

  @Post("inspections")
  createInspection(@CurrentUser() user: RequestUser, @Body() dto: CreateInspectionDto) {
    return this.qualityService.createInspection(user, dto);
  }

  @Patch("inspections/:id")
  updateInspection(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: UpdateInspectionDto) {
    return this.qualityService.updateInspection(user, id, dto);
  }

  @Get("nc-records")
  ncRecords(@CurrentUser() user: RequestUser) {
    return this.qualityService.getNcRecords(user);
  }

  @Get("capa")
  capa(@CurrentUser() user: RequestUser) {
    return this.qualityService.getCapa(user);
  }
}
