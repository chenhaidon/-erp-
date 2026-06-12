import { IsString } from "class-validator";

export class CreateSupplierDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;
}
