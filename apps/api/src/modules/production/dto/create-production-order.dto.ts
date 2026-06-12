import { IsDateString, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateProductionOrderDto {
  @IsString()
  orderNo!: string;

  @IsString()
  productId!: string;

  @IsString()
  @IsOptional()
  routingHeaderId?: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsDateString()
  plannedStartDate!: string;

  @IsDateString()
  plannedEndDate!: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  priority?: number;
}
