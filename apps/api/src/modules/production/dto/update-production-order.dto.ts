import { IsDateString, IsInt, IsOptional, IsString, Min } from "class-validator";

export class UpdateProductionOrderDto {
  @IsString() @IsOptional() orderNo?: string;
  @IsString() @IsOptional() productId?: string;
  @IsString() @IsOptional() routingHeaderId?: string;
  @IsInt() @Min(1) @IsOptional() quantity?: number;
  @IsDateString() @IsOptional() plannedStartDate?: string;
  @IsDateString() @IsOptional() plannedEndDate?: string;
  @IsInt() @Min(1) @IsOptional() priority?: number;
}
