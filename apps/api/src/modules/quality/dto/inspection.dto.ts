import { IsEnum, IsOptional, IsString } from "class-validator";
import { InspectionType, InspectionStatus } from "@prisma/client";

export class CreateInspectionDto {
  @IsString()
  inspectionNo!: string;

  @IsEnum(InspectionType)
  type!: InspectionType;

  @IsString()
  sourceNo!: string;

  @IsString()
  materialId!: string;

  @IsString()
  inspector!: string;
}

export class UpdateInspectionDto {
  @IsEnum(InspectionStatus)
  @IsOptional()
  status?: InspectionStatus;

  @IsString()
  @IsOptional()
  inspector?: string;
}
