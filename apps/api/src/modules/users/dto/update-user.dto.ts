import { IsOptional, IsString } from "class-validator";
import { UserStatus } from "@prisma/client";
import { IsEnum } from "class-validator";

export class UpdateUserDto {
  @IsString() @IsOptional() displayName?: string;
  @IsEnum(UserStatus) @IsOptional() status?: UserStatus;
  @IsString() @IsOptional() defaultFactoryId?: string;
  @IsString() @IsOptional() departmentId?: string;
}
