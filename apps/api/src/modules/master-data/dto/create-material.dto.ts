import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { MaterialType } from "@prisma/client";

export class CreateMaterialDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  specification?: string;

  @IsEnum(MaterialType)
  type!: MaterialType;

  @IsString()
  unit!: string;

  @IsNumber()
  @Min(0)
  safetyStock!: number;

  @IsInt()
  @Min(0)
  leadTimeDays!: number;
}
