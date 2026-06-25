import { Injectable } from '@nestjs/common';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';

@Injectable()
export class IntegrationsService {
  create(createIntegrationDto: CreateIntegrationDto) {
    return {
      message: 'This action adds a new integration',
      data: createIntegrationDto,
    };
  }

  findAll() {
    return `This action returns all integrations`;
  }

  findOne(id: string) {
    return `This action returns a #${id} integration`;
  }

  update(id: string, updateIntegrationDto: UpdateIntegrationDto) {
    return {
      message: `This action updates a #${id} integration`,
      id,
      data: updateIntegrationDto,
    };
  }

  remove(id: string) {
    return `This action removes a #${id} integration`;
  }
}
