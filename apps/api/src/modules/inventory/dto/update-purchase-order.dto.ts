import { IsDateString, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdatePurchaseOrderDto {
  @IsString() @IsOptional() orderNo?: string;
  @IsString() @IsOptional() supplierId?: string;
  @IsString() @IsOptional() materialId?: string;
  @IsNumber() @Min(0.01) @IsOptional() quantity?: number;
  @IsDateString() @IsOptional() dueDate?: string;
}
