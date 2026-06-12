import { IsOptional, IsString } from "class-validator";

export class UpdateSupplierDto {
  @IsString() @IsOptional() code?: string;
  @IsString() @IsOptional() name?: string;
}
