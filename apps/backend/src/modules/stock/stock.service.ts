import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from './entities/stock.entity';
import { ProductRecipe } from './entities/product-recipe.entity';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    @InjectRepository(ProductRecipe)
    private readonly recipeRepository: Repository<ProductRecipe>,
  ) {}

  async create(createStockDto: CreateStockDto) {
    const stock = this.stockRepository.create(createStockDto);
    return this.stockRepository.save(stock);
  }

  findAll(branchId?: string) {
    if (branchId) {
      return this.stockRepository.find({
        where: { branchId },
        order: { ingredientName: 'ASC' },
      });
    }
    return this.stockRepository.find({ order: { ingredientName: 'ASC' } });
  }

  async findLowStock(branchId: string) {
    const items = await this.stockRepository.find({ where: { branchId } });
    return items.filter(
      (s) => s.minStockLevel != null && Number(s.quantity) <= Number(s.minStockLevel),
    );
  }

  async findOne(id: string) {
    const stock = await this.stockRepository.findOne({ where: { id } });
    if (!stock) throw new NotFoundException('Stok kaydı bulunamadı.');
    return stock;
  }

  async update(id: string, updateStockDto: UpdateStockDto) {
    const stock = await this.findOne(id);
    Object.assign(stock, updateStockDto);
    return this.stockRepository.save(stock);
  }

  async remove(id: string) {
    await this.stockRepository.delete(id);
    return { deleted: true };
  }

  findRecipesByProduct(productId: string) {
    return this.recipeRepository.find({
      where: { productId },
      relations: { stock: true },
    });
  }

  async saveRecipe(data: {
    productId: string;
    stockId: string;
    consumedQuantity: number;
  }) {
    const recipe = this.recipeRepository.create(data);
    return this.recipeRepository.save(recipe);
  }

  async removeRecipe(id: string) {
    await this.recipeRepository.delete(id);
    return { deleted: true };
  }
}
