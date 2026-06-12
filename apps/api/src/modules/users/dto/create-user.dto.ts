import { IsArray, IsOptional, IsString, MinLength } from "class-validator";

export class CreateUserDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  displayName!: string;

  @IsString()
  organizationId!: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  defaultFactoryId?: string;

  @IsArray()
  @IsOptional()
  roleIds?: string[];
}
