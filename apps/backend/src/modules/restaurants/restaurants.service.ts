import { Injectable } from '@nestjs/common';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantsService {
  create(createRestaurantDto: CreateRestaurantDto) {
    return {
      message: 'This action adds a new restaurant',
      data: createRestaurantDto,
    };
  }

  findAll() {
    return `This action returns all restaurants`;
  }

  findOne(id: string) {
    return `This action returns a #${id} restaurant`;
  }

  update(id: string, updateRestaurantDto: UpdateRestaurantDto) {
    return {
      message: `This action updates a #${id} restaurant`,
      id,
      data: updateRestaurantDto,
    };
  }

  remove(id: string) {
    return `This action removes a #${id} restaurant`;
  }
}
