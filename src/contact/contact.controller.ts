import { Body, Controller, Post, HttpException, HttpStatus } from '@nestjs/common';
import { ContactService } from './contact.service';

@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Post()
  submit(@Body() dto: { message?: string }) {
    if (!dto.message || dto.message.trim().length < 10) {
      throw new HttpException(
        'Message must be at least 10 characters.',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.contact.submit(dto);
  }
}
