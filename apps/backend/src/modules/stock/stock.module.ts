import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { Stock } from './entities/stock.entity';
import { ProductRecipe } from './entities/product-recipe.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Stock, ProductRecipe])],
  controllers: [StockController],
  providers: [StockService],
  exports: [TypeOrmModule],
})
export class StockModule {}
