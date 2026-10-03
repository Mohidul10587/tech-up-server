import {
  IsEmail,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CourseInfoDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMonths?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  regularFee?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  presentFee?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

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
  @IsObject()
  @ValidateNested()
  @Type(() => CourseInfoDto)
  mobileRepairingCourse?: CourseInfoDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CourseInfoDto)
  englishSpeakingCourse?: CourseInfoDto;
}
