import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { UserContext } from '../../shared/domain/user-context.interface';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @RequirePermissions('categories.view')
  @ApiOperation({ summary: 'Lista as categorias do usuário' })
  @ApiOkResponse({ description: 'Categorias retornadas com sucesso.' })
  @Get()
  list(@CurrentUser() user: UserContext) {
    return this.categoriesService.list(user.sub);
  }

  @RequirePermissions('categories.create')
  @ApiOperation({ summary: 'Cria uma categoria' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiOkResponse({ description: 'Categoria criada com sucesso.' })
  @Post()
  create(@CurrentUser() user: UserContext, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(user.sub, dto);
  }

  @RequirePermissions('categories.update')
  @ApiOperation({ summary: 'Atualiza uma categoria' })
  @ApiParam({ name: 'id', example: 'ckz8x9abc0000b9x0c1d2e3f4' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiOkResponse({ description: 'Categoria atualizada com sucesso.' })
  @Patch(':id')
  update(@CurrentUser() user: UserContext, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(user.sub, id, dto);
  }

  @RequirePermissions('categories.delete')
  @ApiOperation({ summary: 'Remove uma categoria' })
  @ApiParam({ name: 'id', example: 'ckz8x9abc0000b9x0c1d2e3f4' })
  @ApiOkResponse({ description: 'Categoria removida com sucesso.' })
  @Delete(':id')
  remove(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.categoriesService.remove(user.sub, id);
  }
}
