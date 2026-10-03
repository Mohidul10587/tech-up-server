import { IsIn, IsNotEmpty, IsString, Matches } from 'class-validator';

export const COURSE_NAMES = ['Mobile Repairing', 'English Speaking'] as const;
export type CourseName = (typeof COURSE_NAMES)[number];

export class CreateBatchDto {
  /**
   * The batch identifier, e.g. "1", "2", "10". Only digits are accepted.
   * Uniqueness is per-course, so Batch 1 can exist for both courses.
   */
  @IsString()
  @IsNotEmpty({ message: 'Batch name is required.' })
  @Matches(/^\d+$/, { message: 'Batch name must be a number (e.g. 1, 2, 10).' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'courseName is required.' })
  @IsIn(COURSE_NAMES, {
    message: `courseName must be one of: ${COURSE_NAMES.join(', ')}.`,
  })
  courseName!: CourseName;
}
