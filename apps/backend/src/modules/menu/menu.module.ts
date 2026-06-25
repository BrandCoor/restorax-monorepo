import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { ProductOption } from './entities/product-option.entity';
import { ProductOptionValue } from './entities/product-option-value.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      Product,
      ProductOption,
      ProductOptionValue,
    ]),
  ],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [TypeOrmModule],
})
export class MenuModule {}
