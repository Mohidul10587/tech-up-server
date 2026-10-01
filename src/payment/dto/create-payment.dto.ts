import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  /** Amount in taka (whole number, minimum 1). */
  @IsInt()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  note?: string;

  /**
   * Optional ISO date string. Defaults to now() if omitted so the admin can
   * back-date a payment when entering it after the fact.
   */
  @IsOptional()
  @IsString()
  paidAt?: string;
}
