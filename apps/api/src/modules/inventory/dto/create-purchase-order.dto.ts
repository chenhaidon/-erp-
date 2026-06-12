import { IsDateString, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreatePurchaseOrderDto {
  @IsString()
  orderNo!: string;

  @IsString()
  supplierId!: string;

  @IsString()
  materialId!: string;

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsDateString()
  dueDate!: string;
}
