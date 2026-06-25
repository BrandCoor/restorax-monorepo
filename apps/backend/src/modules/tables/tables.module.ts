import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TablesService } from './tables.service';
import { TablesController } from './tables.controller';
import { Table } from './entities/table.entity';
import { TableSection } from './entities/table-section.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Table, TableSection])],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TypeOrmModule],
})
export class TablesModule {}
