import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { MaterialType } from "@prisma/client";

export class UpdateMaterialDto {
  @IsString() @IsOptional() code?: string;
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() specification?: string;
  @IsEnum(MaterialType) @IsOptional() type?: MaterialType;
  @IsString() @IsOptional() unit?: string;
  @IsNumber() @Min(0) @IsOptional() safetyStock?: number;
  @IsInt() @Min(0) @IsOptional() leadTimeDays?: number;
}
