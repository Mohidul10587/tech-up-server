import { IsIn, IsNotEmpty, IsString, Matches } from 'class-validator';
import { COURSE_NAMES } from '../../common/course-names';
import type { CourseName } from '../../common/course-names';

export { COURSE_NAMES };
export type { CourseName };

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
