import { IsString, MinLength } from "class-validator";

export class AiPromptDto {
  @IsString()
  @MinLength(2)
  prompt!: string;
}
