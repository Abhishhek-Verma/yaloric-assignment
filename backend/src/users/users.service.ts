import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: createUserDto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const rawPassword = createUserDto.password || 'Default@123';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    return this.prisma.user.create({
      data: {
        firstName: createUserDto.firstName.trim(),
        lastName: createUserDto.lastName.trim(),
        email: createUserDto.email.toLowerCase().trim(),
        phone: createUserDto.phone.trim(),
        password: hashedPassword,
      },
      select: userSelect,
    });
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    });

    // Pinned sort: ADMIN accounts first, followed by regular USER accounts (newest first)
    return users.sort((a, b) => {
      if (a.role === Role.ADMIN && b.role !== Role.ADMIN) return -1;
      if (a.role !== Role.ADMIN && b.role === Role.ADMIN) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    if (updateUserDto.email) {
      const email = updateUserDto.email.toLowerCase().trim();
      const existing = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(updateUserDto.firstName !== undefined && { firstName: updateUserDto.firstName.trim() }),
        ...(updateUserDto.lastName !== undefined && { lastName: updateUserDto.lastName.trim() }),
        ...(updateUserDto.email !== undefined && { email: updateUserDto.email.toLowerCase().trim() }),
        ...(updateUserDto.phone !== undefined && { phone: updateUserDto.phone.trim() }),
      },
      select: userSelect,
    });
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    if (user.role === Role.ADMIN) {
      throw new BadRequestException('Administrator accounts cannot be deleted');
    }

    await this.prisma.user.delete({ where: { id } });
    return { success: true, message: 'User deleted successfully' };
  }
}
