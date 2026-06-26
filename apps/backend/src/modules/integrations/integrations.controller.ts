import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post()
  create(@Body() createIntegrationDto: CreateIntegrationDto) {
    return this.integrationsService.create(createIntegrationDto);
  }

  @Post('upsert')
  upsert(
    @Body()
    body: {
      branchId: string;
      platformName: string;
      apiKey: string;
      apiSecret?: string;
      isActive?: boolean;
    },
  ) {
    return this.integrationsService.upsertPlatform(body);
  }

  @Get()
  findAll(@Query('branchId') branchId?: string) {
    return this.integrationsService.findAll(branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.integrationsService.findOne(id);
  }

  @Patch(':id/toggle')
  toggle(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.integrationsService.toggle(id, isActive);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateIntegrationDto: UpdateIntegrationDto,
  ) {
    return this.integrationsService.update(id, updateIntegrationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.integrationsService.remove(id);
  }
}
