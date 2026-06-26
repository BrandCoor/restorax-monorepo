import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Employee } from './entities/employee.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    const role = await this.roleRepository.findOne({
      where: { name: createEmployeeDto.roleName || 'WAITER' },
    });
    if (!role) throw new NotFoundException('Rol bulunamadı.');

    const passwordHash = await bcrypt.hash(createEmployeeDto.password, 10);
    const user = this.userRepository.create({
      email: createEmployeeDto.email,
      passwordHash,
      firstName: createEmployeeDto.firstName,
      lastName: createEmployeeDto.lastName,
      phone: createEmployeeDto.phone,
      role,
    });
    const savedUser = await this.userRepository.save(user);

    const employee = this.employeeRepository.create({
      userId: savedUser.id,
      branchId: createEmployeeDto.branchId,
      salary: createEmployeeDto.salary,
      workingHours: createEmployeeDto.workingHours,
    });
    return this.employeeRepository.save(employee);
  }

  findAll(branchId?: string) {
    if (branchId) {
      return this.employeeRepository.find({
        where: { branchId },
        relations: { user: { role: true } },
      });
    }
    return this.employeeRepository.find({
      relations: { user: { role: true } },
    });
  }

  async findOne(id: string) {
    const employee = await this.employeeRepository.findOne({
      where: { id },
      relations: { user: { role: true } },
    });
    if (!employee) throw new NotFoundException('Personel bulunamadı.');
    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    const employee = await this.findOne(id);
    if (updateEmployeeDto.salary != null) employee.salary = updateEmployeeDto.salary;
    if (updateEmployeeDto.workingHours != null) {
      employee.workingHours = updateEmployeeDto.workingHours;
    }
    if (updateEmployeeDto.firstName || updateEmployeeDto.lastName || updateEmployeeDto.phone) {
      if (updateEmployeeDto.firstName) employee.user.firstName = updateEmployeeDto.firstName;
      if (updateEmployeeDto.lastName) employee.user.lastName = updateEmployeeDto.lastName;
      if (updateEmployeeDto.phone) employee.user.phone = updateEmployeeDto.phone;
      await this.userRepository.save(employee.user);
    }
    return this.employeeRepository.save(employee);
  }

  async remove(id: string) {
    const employee = await this.findOne(id);
    await this.employeeRepository.delete(id);
    await this.userRepository.delete(employee.userId);
    return { deleted: true };
  }
}
