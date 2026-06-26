import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Integration } from './entities/integration.entity';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectRepository(Integration)
    private readonly integrationRepository: Repository<Integration>,
  ) {}

  create(createIntegrationDto: CreateIntegrationDto) {
    const integration = this.integrationRepository.create(createIntegrationDto);
    return this.integrationRepository.save(integration);
  }

  findAll(branchId?: string) {
    if (branchId) {
      return this.integrationRepository.find({ where: { branchId } });
    }
    return this.integrationRepository.find();
  }

  async findOne(id: string) {
    const integration = await this.integrationRepository.findOne({ where: { id } });
    if (!integration) throw new NotFoundException('Entegrasyon bulunamadı.');
    return integration;
  }

  async update(id: string, updateIntegrationDto: UpdateIntegrationDto) {
    const integration = await this.findOne(id);
    Object.assign(integration, updateIntegrationDto);
    return this.integrationRepository.save(integration);
  }

  async toggle(id: string, isActive: boolean) {
    const integration = await this.findOne(id);
    integration.isActive = isActive;
    return this.integrationRepository.save(integration);
  }

  async remove(id: string) {
    await this.integrationRepository.delete(id);
    return { deleted: true };
  }

  async upsertPlatform(data: {
    branchId: string;
    platformName: string;
    apiKey: string;
    apiSecret?: string;
    isActive?: boolean;
  }) {
    let integration = await this.integrationRepository.findOne({
      where: { branchId: data.branchId, platformName: data.platformName },
    });
    if (integration) {
      integration.apiKey = data.apiKey;
      integration.apiSecret = data.apiSecret;
      if (data.isActive != null) integration.isActive = data.isActive;
      return this.integrationRepository.save(integration);
    }
    integration = this.integrationRepository.create(data);
    return this.integrationRepository.save(integration);
  }
}
