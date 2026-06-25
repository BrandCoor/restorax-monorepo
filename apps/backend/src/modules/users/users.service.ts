import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  // Uygulama ayağa kalktığında otomatik tetiklenir
  async onModuleInit() {
    await this.seedRoles();
  }

  private async seedRoles() {
    try {
      const count = await this.roleRepository.count();
      if (count === 0) {
        const defaultRoles = [
          { name: 'SUPER_ADMIN' },
          { name: 'OWNER' },
          { name: 'MANAGER' },
          { name: 'WAITER' },
          { name: 'KITCHEN' },
        ];
        await this.roleRepository.save(defaultRoles);
        console.log(
          '✅ [SEED] Default roles successfully created: SUPER_ADMIN, OWNER, MANAGER, WAITER, KITCHEN',
        );
      }
    } catch (error) {
      console.error('❌ [SEED ERROR] Failed to seed default roles:', error);
    }
  }

  create(createUserDto: CreateUserDto) {
    return {
      message: 'This action adds a new user',
      data: createUserDto,
    };
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: string) {
    return `This action returns a #${id} user`;
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return {
      message: `This action updates a #${id} user`,
      id,
      data: updateUserDto,
    };
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }
}
