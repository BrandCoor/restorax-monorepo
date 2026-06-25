import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsController } from './restaurants.controller';
import { Restaurant } from './entities/restaurant.entity';
import { Branch } from './entities/branch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Branch])],
  controllers: [RestaurantsController],
  providers: [RestaurantsService],
  exports: [TypeOrmModule],
})
export class RestaurantsModule {}
