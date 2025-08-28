import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../schemas/user.schema';
import { SignupDto, LoginDto, AuthResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto): Promise<AuthResponseDto> {
    const { email, username, password } = signupDto;

    const existingUserByEmail = await this.userModel.findOne({ email });
    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists');
    }

    const existingUserByUsername = await this.userModel.findOne({ username });
    if (existingUserByUsername) {
      throw new ConflictException('User with this username already exists');
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new this.userModel({
      email,
      username,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    // Generate JWT token
    const payload = { email: savedUser.email, sub: savedUser._id };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: savedUser.id.toString(),
        email: savedUser.email,
        username: savedUser.username,
      },
    };
  }

  async login(user: any): Promise<AuthResponseDto> {
    // Update last login
    await this.userModel.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const payload = { email: user.email, sub: user._id };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Return user without password
    const { password: _, ...result } = user.toObject();
    return result;
  }

  async validateUserById(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return null;
    }

    // Return user without password
    const { password: _, ...result } = user.toObject();
    return result;
  }

  async getUserProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}