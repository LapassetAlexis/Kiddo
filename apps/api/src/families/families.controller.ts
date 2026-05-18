import { Body, Controller, Post } from '@nestjs/common';
import { FamiliesService } from './families.service';

@Controller('families')
export class FamiliesController {
  constructor(private readonly svc: FamiliesService) {}
  @Post() register(@Body() body: { email: string; password: string }) {
    return this.svc.register(body.email, body.password);
  }
}
