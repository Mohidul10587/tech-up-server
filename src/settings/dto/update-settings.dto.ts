import { IsEmail, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  courseFeesMobileRepairing?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  courseFeesEnglishSpeaking?: number;
}
