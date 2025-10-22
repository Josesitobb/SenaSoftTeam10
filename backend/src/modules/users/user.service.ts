import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateUserDto) {
    const payload: any = {
      nombre_usuario: data.nombre,
      email: data.email,
      password_hash: data.password,
    };

    // Campos obligatorios según el schema: tipo_documento, documento, id_rol
    const required = ['tipo_documento', 'documento', 'id_rol'];
    for (const key of required) {
      const val = (data as any)[key];
      if (val !== undefined && val !== null) payload[key] = val;
    }

    const missing = required.filter((k) => payload[k] === undefined || payload[k] === null);
    if (missing.length) {
      throw new BadRequestException(
        `Faltan campos obligatorios para crear usuario: ${missing.join(', ')}`,
      );
    }

    // Hacemos un cast a any para evitar discrepancias estrictas de tipos aquí
    return this.prisma.usuarios.create({ data: payload as any });
  }

  findAll() {
    return this.prisma.usuarios.findMany();
  }

  findOne(id: number) {
    return this.prisma.usuarios.findUnique({ where: { id_usuario: id } });
  }

  update(id: number, data: UpdateUserDto) {
    return this.prisma.usuarios.update({ where: { id_usuario: id }, data });
  }

  remove(id: number) {
    return this.prisma.usuarios.delete({ where: { id_usuario: id } });
  }
}
