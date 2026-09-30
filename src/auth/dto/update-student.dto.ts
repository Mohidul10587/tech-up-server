import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { COURSE_NAMES, STUDENT_PROFILE_FIELDS } from './student-profile.dto';
import type { CourseName } from './student-profile.dto';

/**
 * Payload for editing an existing student.
 *
 * Deliberately does NOT extend `StudentProfileDto`: that class carries the
 * "at least one of nidNumber / birthRegistrationNumber" rule, which is correct
 * on CREATE but wrong on a partial update. A PATCH that only changes `batchNo`
 * carries no identifiers, and reusing the create rule would reject it.
 *
 * Every field is `@IsOptional()`, so an omitted key leaves the stored value
 * untouched while an explicitly empty string CLEARS it (see the service).
 */
export class UpdateStudentDto {
  /**
   * The student's phone number. This doubles as their password, so changing it
   * changes the login credentials too - the service re-hashes accordingly.
   */
  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\-\s]{6,20}$/, {
    message:
      'phone must be a valid phone number (6-20 digits, optional + and -).',
  })
  phone?: string;

  // Mirrors STUDENT_PROFILE_FIELDS. Kept explicit rather than generated so the
  // validation metadata stays readable.
  @IsOptional()
  @IsString()
  batchNo?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((_object, value) => value !== '')
  @IsIn(COURSE_NAMES, {
    message: `courseName must be one of: ${COURSE_NAMES.join(', ')}.`,
  })
  courseName?: CourseName;

  @IsOptional()
  @IsString()
  fatherName?: string;

  @IsOptional()
  @IsString()
  motherName?: string;

  @IsOptional()
  @IsString()
  presentAddress?: string;

  @IsOptional()
  @IsString()
  permanentAddress?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\-\s]{6,20}$/, {
    message:
      'guardianPhone must be a valid phone number (6-20 digits, optional + and -).',
  })
  guardianPhone?: string;

  @IsOptional()
  @IsString()
  @IsEmail({}, { message: 'email must be a valid email address.' })
  email?: string;

  @IsOptional()
  @IsString()
  nidNumber?: string;

  @IsOptional()
  @IsString()
  birthRegistrationNumber?: string;

  @IsOptional()
  @IsString()
  studentPhoto?: string;

  @IsOptional()
  @IsString()
  studentNidFrontImage?: string;

  @IsOptional()
  @IsString()
  studentNidBackImage?: string;

  @IsOptional()
  @IsString()
  guardianNidFrontImage?: string;

  @IsOptional()
  @IsString()
  guardianNidBackImage?: string;
}

/** Profile fields accepted on update (everything except `phone`). */
export const UPDATABLE_STUDENT_FIELDS = STUDENT_PROFILE_FIELDS;
