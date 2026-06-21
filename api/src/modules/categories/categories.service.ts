import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const defaultCategories = [
  'Moradia',
  'Água',
  'Energia',
  'Internet',
  'Telefonia',
  'Streaming',
  'Transporte',
  'Alimentação',
  'Educação',
  'Saúde',
  'Impostos',
  'Cartão de Crédito',
  'Empréstimos',
  'Outros',
];

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async seedDefaults(userId: string): Promise<void> {
    await this.prisma.$transaction(
      defaultCategories.map((name) =>
        this.prisma.category.upsert({
          where: { userId_name: { userId, name } },
          create: { userId, name },
          update: {},
        }),
      ),
    );
  }

  list(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  create(userId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        userId,
        name: dto.name,
        color: dto.color ?? '#0ea5e9',
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name ?? category.name,
        color: dto.color ?? category.color,
      },
    });
  }

  async remove(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const billsCount = await this.prisma.bill.count({ where: { categoryId: id } });
    if (billsCount > 0) {
      throw new BadRequestException('Category is being used by bills');
    }

    await this.prisma.category.delete({ where: { id } });
  }
}
