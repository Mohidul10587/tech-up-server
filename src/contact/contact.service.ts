import { Injectable } from '@nestjs/common';

export interface ContactDto {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

@Injectable()
export class ContactService {
  async submit(dto: ContactDto) {
    // Placeholder for delivery integration (e.g. email provider).
    // The message is validated by the controller and acknowledged here.
    return { ok: true, id: `contact_${Date.now()}` };
  }
}
