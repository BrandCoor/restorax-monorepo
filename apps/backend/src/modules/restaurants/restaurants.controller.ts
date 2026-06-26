import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get('branches/:id')
  findBranch(@Param('id') id: string) {
    return this.restaurantsService.findBranch(id);
  }

  @Patch('branches/:id')
  updateBranch(
    @Param('id') id: string,
    @Body() body: { name?: string; address?: string; phone?: string; isActive?: boolean },
  ) {
    return this.restaurantsService.updateBranch(id, body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRestaurantDto: UpdateRestaurantDto) {
    return this.restaurantsService.update(id, updateRestaurantDto);
  }
}
