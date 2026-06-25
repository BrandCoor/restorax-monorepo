import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { Integration } from './entities/integration.entity';
import { PlatformOrder } from './entities/platform-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Integration, PlatformOrder])],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [TypeOrmModule],
})
export class IntegrationsModule {}
