import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { Employee } from './entities/employee.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, User, Role])],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService, TypeOrmModule],
})
export class EmployeesModule {}
