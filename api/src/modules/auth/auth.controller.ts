import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { UserContext } from '../../shared/domain/user-context.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({ summary: 'Cria uma nova conta e retorna um token JWT' })
  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({ description: 'Conta criada com sucesso.' })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @ApiOperation({ summary: 'Autentica um usuário existente e retorna um token JWT' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Autenticação realizada com sucesso.' })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Retorna os dados do usuário autenticado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: 'Usuário autenticado encontrado.' })
  @Get('me')
  me(@CurrentUser() user: UserContext) {
    return user;
  }
}
