import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { Branch } from './entities/branch.entity';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  async findOne(id: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id },
      relations: { branches: true },
    });
    if (!restaurant) throw new NotFoundException('Restoran bulunamadı.');
    return restaurant;
  }

  async findBranch(id: string) {
    const branch = await this.branchRepository.findOne({
      where: { id },
      relations: { restaurant: true },
    });
    if (!branch) throw new NotFoundException('Şube bulunamadı.');
    return branch;
  }

  async update(id: string, updateRestaurantDto: UpdateRestaurantDto) {
    const restaurant = await this.findOne(id);
    Object.assign(restaurant, updateRestaurantDto);
    return this.restaurantRepository.save(restaurant);
  }

  async updateBranch(
    id: string,
    data: { name?: string; address?: string; phone?: string; isActive?: boolean },
  ) {
    const branch = await this.findBranch(id);
    Object.assign(branch, data);
    return this.branchRepository.save(branch);
  }
}
