import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table } from './entities/table.entity';
import { TableSection } from './entities/table-section.entity';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(TableSection)
    private readonly sectionRepository: Repository<TableSection>,
  ) {}

  create(createTableDto: CreateTableDto) {
    return {
      message: 'This action adds a new table',
      data: createTableDto,
    };
  }

  // 1. İşlem: Şubeye göre tüm bölümleri ve içlerindeki masaları getir
  async findAllByBranch(branchId: string) {
    return this.sectionRepository.find({
      where: { branch: { id: branchId } },
      relations: { tables: true },
      order: { name: 'ASC' },
    });
  }

  // Standart listeleme
  async findAll() {
    return this.tableRepository.find({
      relations: { section: true },
    });
  }

  async findOne(id: string) {
    return this.tableRepository.findOne({
      where: { id },
      relations: { section: true },
    });
  }

  async update(id: string, updateTableDto: UpdateTableDto) {
    await this.tableRepository.update(id, updateTableDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.tableRepository.delete(id);
    return { deleted: true };
  }
}