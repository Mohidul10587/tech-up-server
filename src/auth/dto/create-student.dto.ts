import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { StudentProfileDto } from './student-profile.dto';

/**
 * Payload for registering a student from the admin panel.
 *
 * There is deliberately NO `password` field: the student's phone number doubles
 * as their password by default, so accepting one here would create a mismatch
 * between what the admin typed and what the student can actually log in with.
 * `whitelist: true` in the global ValidationPipe strips any such field anyway.
 *
 * The student profile fields (and the at-least-one-identifier rule) are
 * inherited from `StudentProfileDto`.
 */
export class CreateStudentDto extends StudentProfileDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9+\-\s]{6,20}$/, {
    message:
      'phone must be a valid phone number (6-20 digits, optional + and -).',
  })
  phone!: string;
}
