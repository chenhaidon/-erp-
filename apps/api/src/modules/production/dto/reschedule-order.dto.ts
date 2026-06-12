import { IsDateString, IsInt, IsOptional, Min } from "class-validator";

export class RescheduleOrderDto {
  @IsDateString() @IsOptional() plannedStartDate?: string;
  @IsDateString() @IsOptional() plannedEndDate?: string;
  @IsInt() @Min(1) @IsOptional() priority?: number;
}
