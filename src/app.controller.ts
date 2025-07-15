import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

   @Get('protected')
  @UseGuards(AuthGuard('jwt'))
  getProtected(@Request() req: Request & { user: any }) {
    return {
      message: 'This is a protected route!',
      user: req.user, // contains { userId, email }
    };
  }
}
