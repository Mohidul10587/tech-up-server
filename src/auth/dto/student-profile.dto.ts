import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { COURSE_NAMES } from '../../common/course-names';
import type { CourseName } from '../../common/course-names';

export { COURSE_NAMES };
export type { CourseName };

const IDENTIFIER_FIELDS = ['nidNumber', 'birthRegistrationNumber'] as const;

const IDENTIFIER_LABELS: Record<string, string> = {
  nidNumber: 'NID Number',
  birthRegistrationNumber: 'Birth Registration Number',
};

/**
 * Enforces the student identification rule: at least one of
 * `nidNumber` / `birthRegistrationNumber` must be non-empty.
 * Providing both is allowed; providing neither is rejected.
 *
 * IMPORTANT: this is attached as a plain (unconditioned) `@Validate` on
 * `nidNumber`. Decorating the same property with `@IsOptional()` or
 * `@ValidateIf(...)` makes class-validator skip the whole property whenever it
 * is absent, which silently lets a completely empty payload pass. The
 * per-property type check is therefore handled by `StringOrUndefinedConstraint`
 * rather than by `@IsString()`.
 */
@ValidatorConstraint({ name: 'atLeastOneIdentifier', async: false })
export class AtLeastOneIdentifierConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as Record<string, unknown> | undefined;
    if (!obj) return false;

    return IDENTIFIER_FIELDS.some((key) => {
      const raw = obj[key];
      return typeof raw === 'string' && raw.trim().length > 0;
    });
  }

  defaultMessage(): string {
    const label = IDENTIFIER_FIELDS.map((key) => IDENTIFIER_LABELS[key]).join(
      ' or ',
    );
    return `At least one of ${label} is required.`;
  }
}

/**
 * Type check that tolerates absence: the value must be a string when supplied,
 * but `undefined` / `null` is allowed. Used where a property must not carry
 * `@IsOptional()` (see note on `AtLeastOneIdentifierConstraint`).
 */
@ValidatorConstraint({ name: 'isStringOrUndefined', async: false })
export class StringOrUndefinedConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return value === undefined || value === null || typeof value === 'string';
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a string.`;
  }
}

/**
 * Payload accepted when creating or updating a student's profile fields.
 *
 * Every field is optional at the database level so existing users keep working
 * untouched, but the cross-field identifier rule above is mandatory whenever a
 * student profile payload is submitted.
 */
export class StudentProfileDto {
  // --- Student Information ---
  // Declaration order below mirrors the registration serial exactly:
  // batch no, student name, father, mother, present address, permanent address,
  // (the student's own phone number comes from `CreateStudentDto.phone`),
  // occupation, NID / birth registration number, guardian phone, email.
  @IsOptional()
  @IsString()
  batchNo?: string;

  /**
   * The student's own name. Required whenever a student profile is submitted
   * through the admin form, but kept `@IsOptional()` so that non-admin roles
   * are unaffected.
   */
  @IsOptional()
  @IsString()
  fullName?: string;

  /** Optional because this column is also present on non-student user rows. */
  @IsOptional()
  @IsString()
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

  // --- Contact Details ---
  /** The parent/guardian's phone number (the student's own is `phone`). */
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

  // --- Student Identification ---
  // Individually optional, but at least one of the two is required.
  @Validate(AtLeastOneIdentifierConstraint)
  @Validate(StringOrUndefinedConstraint)
  nidNumber?: string;

  @Validate(StringOrUndefinedConstraint)
  birthRegistrationNumber?: string;

  // --- Student Photo & Documents ---
  @IsOptional()
  @IsString()
  studentPhoto?: string;

  @IsOptional()
  @IsString()
  studentNidFrontImage?: string;

  @IsOptional()
  @IsString()
  studentNidBackImage?: string;

  // --- Guardian NID Documents ---
  @IsOptional()
  @IsString()
  guardianNidFrontImage?: string;

  @IsOptional()
  @IsString()
  guardianNidBackImage?: string;
}

/** Field names accepted as student profile input. */
export const STUDENT_PROFILE_FIELDS = [
  'batchNo',
  'fullName',
  'courseName',
  'fatherName',
  'motherName',
  'presentAddress',
  'permanentAddress',
  'occupation',
  'guardianPhone',
  'email',
  'nidNumber',
  'birthRegistrationNumber',
  'studentPhoto',
  'studentNidFrontImage',
  'studentNidBackImage',
  'guardianNidFrontImage',
  'guardianNidBackImage',
] as const;

export type StudentProfileField = (typeof STUDENT_PROFILE_FIELDS)[number];
