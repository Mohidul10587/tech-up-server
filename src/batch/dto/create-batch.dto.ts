import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateBatchDto {
  /**
   * The batch identifier, e.g. "1", "2", "10". Only digits are accepted so
   * the value is always a clean number string.
   */
  @IsString()
  @IsNotEmpty({ message: 'Batch name is required.' })
  @Matches(/^\d+$/, { message: 'Batch name must be a number (e.g. 1, 2, 10).' })
  name!: string;
}
