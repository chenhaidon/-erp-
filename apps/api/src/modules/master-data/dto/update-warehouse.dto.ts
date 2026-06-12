import { IsOptional, IsString } from "class-validator";

export class UpdateWarehouseDto {
  @IsString() @IsOptional() code?: string;
  @IsString() @IsOptional() name?: string;
}
