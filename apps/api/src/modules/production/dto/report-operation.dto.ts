import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class ReportOperationDto {
  @IsString()
  reportType!: string;

  @IsNumber()
  @Min(0)
  reportedQty!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  scrapQty?: number;

  @IsString()
  @IsOptional()
  operationCode?: string;
}
