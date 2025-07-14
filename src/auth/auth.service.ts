import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { JWT_ACCESS_TOKEN_EXPIRES_IN, JWT_REFRESH_TOKEN_EXPIRES_IN } from 'src/common/constants/jwt.contants';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}



  // Signup (register user and store in DB)
async signup(signupDto: SignupDto) {
  const { username, email, password } = signupDto;

  const existingUser = await this.userModel.findOne({ email });
  if (existingUser) {
    throw new BadRequestException('Email is already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new this.userModel({ username, email, password: hashedPassword });
  const user = await newUser.save();

  const payload = { sub: user._id, email: user.email };
  const accessToken = this.jwtService.sign(payload, { expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN });
  const refreshToken = this.jwtService.sign(payload, { expiresIn: JWT_REFRESH_TOKEN_EXPIRES_IN });

  user.refreshToken = refreshToken;
  await user.save();

  const { password: _, ...userData } = user.toObject();

  return {
    message: 'Signup successful. Logged in automatically.',
    accessToken,
    refreshToken,
    user: userData,
  };
}



async login(loginDto: LoginDto) {
  const { email, password } = loginDto;

  const user = await this.userModel.findOne({ email });
  if (!user) {
    throw new UnauthorizedException('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid email or password');
  }

  const payload = { sub: user._id, email: user.email };
  const accessToken = this.jwtService.sign(payload, { expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN });
  const refreshToken = this.jwtService.sign(payload, { expiresIn: JWT_REFRESH_TOKEN_EXPIRES_IN });

  // Optionally store refreshToken somewhere

  const { password: _,refreshToken: __, ...userData } = user.toObject();
  await this.userModel.findByIdAndUpdate(user.id, { refreshToken });
  return {
    accessToken,
    refreshToken,
    user: userData,
  };
}

async logout(userId: string) {
  const user = await this.userModel.findById(userId);
  if (!user) {
    throw new BadRequestException('User not found');
  }

  user.refreshToken = null;
  await user.save();

  return { message: 'User logged out successfully' };
}

  async refreshTokens(userId: string, oldRefreshToken: string) {
  const user = await this.userModel.findById(userId);
  if (!user || !user.refreshToken) {
    throw new UnauthorizedException('Refresh token not found');
  }

  if (user.refreshToken !== oldRefreshToken) {
    throw new UnauthorizedException('Invalid or expired refresh token');
  }

  const payload = { sub: user._id, email: user.email };
  const newAccessToken = this.jwtService.sign(payload, { expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN });
  const newRefreshToken = this.jwtService.sign(payload, { expiresIn: JWT_REFRESH_TOKEN_EXPIRES_IN });

  user.refreshToken = newRefreshToken;
  await user.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}


}