import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request.type';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ✅ Get all users (protected)
  @UseGuards(JwtAuthGuard)
  @Get()
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  // ✅ Get user by ID (public or protected based on your policy)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getUserById(@Param('id') userId: string) {
    return this.usersService.getUserById(userId);
  }

  // ✅ Secure: Update own profile (PATCH /users/me)
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request & { user: any },
  ) {
    const userId = req.user.userId;
    const updatedUser = await this.usersService.updateUser(userId, updateUserDto);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'Your profile was updated successfully.',
      data: updatedUser,
    };
  }

  // ✅ Follow another user
  @UseGuards(JwtAuthGuard)
  @Post('follow/:id')
  followUser(@Req() req: AuthenticatedRequest, @Param('id') targetUserId: string) {
    const currentUserId = req.user.userId;
    return this.usersService.followUser(currentUserId, targetUserId);
  }

  // ✅ Unfollow another user
  @UseGuards(JwtAuthGuard)
  @Post('unfollow/:id')
  unfollowUser(@Req() req: AuthenticatedRequest, @Param('id') targetUserId: string) {
    const currentUserId = req.user.userId;
    return this.usersService.unfollowUser(currentUserId, targetUserId);
  }
}
