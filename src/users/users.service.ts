// existing imports...
import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // Get all users
  async getAllUsers() {
    return this.userModel.find().select('-password -refreshToken');
  }

  // Get user by ID
  async getUserById(userId: string) {
    const user = await this.userModel.findById(userId).select('-password -refreshToken');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // Update user
  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateUserDto },
      { new: true },
    ).select('-password -refreshToken');

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  // Follow and unfollow methods are already here ✅



// Follow a user
async followUser(userId: string, targetUserId: string) {
  if (userId === targetUserId) {
    throw new BadRequestException('You cannot follow yourself.');
  }

  const user = await this.userModel.findById(userId);
  const targetUser = await this.userModel.findById(targetUserId);

  if (!user || !targetUser) {
    throw new NotFoundException('User not found.');
  }

  if (user.following.includes(new Types.ObjectId(targetUserId))) {
    throw new BadRequestException('Already following this user.');
  }

  user.following.push(new Types.ObjectId(targetUserId));
  targetUser.followers.push(new Types.ObjectId(userId));

  await user.save();
  await targetUser.save();

  return { message: 'Followed successfully.' };
}

// Unfollow a user
async unfollowUser(userId: string, targetUserId: string) {
  const user = await this.userModel.findById(userId);
  const targetUser = await this.userModel.findById(targetUserId);

  if (!user || !targetUser) {
    throw new NotFoundException('User not found.');
  }

  if (!user.following.includes(new Types.ObjectId(targetUserId))) {
    throw new BadRequestException('You are not following this user.');
  }

  user.following = user.following.filter(
    (id) => id.toString() !== targetUserId,
  );
  targetUser.followers = targetUser.followers.filter(
    (id) => id.toString() !== userId,
  );

  await user.save();
  await targetUser.save();

  return { message: 'Unfollowed successfully.' };
}

}
