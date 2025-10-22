import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateUserDto) {
    return this.prisma.usuario.create({ data });
  }

  findAll() {
    return this.prisma.usuario.findMany();
  }

  findOne(id: number) {
    return this.prisma.usuario.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateUserDto) {
    return this.prisma.usuario.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.usuario.delete({ where: { id } });
  }
}
