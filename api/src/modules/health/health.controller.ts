import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../shared/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @ApiOperation({ summary: 'Verifica se a API está respondendo' })
  @ApiOkResponse({ description: 'API saudável.' })
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }
}
