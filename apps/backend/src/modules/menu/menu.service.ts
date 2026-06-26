import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  create(createMenuDto: CreateMenuDto) {
    return {
      message: 'This action adds a new menu item',
      data: createMenuDto,
    };
  }

  // Şubeye özel aktif kategorileri ve içindeki ürünleri ilişkili çeker [2]
  async findAllByBranch(branchId: string) {
    return this.categoryRepository.find({
      where: { branch: { id: branchId }, isActive: true },
      relations: { products: true },
      order: { name: 'ASC' },
    });
  }

  async findAll() {
    return this.categoryRepository.find({
      relations: { products: true },
    });
  }

  findOne(id: string) {
    return this.productRepository.findOne({
      where: { id },
      relations: { category: true },
    });
  }

  update(id: string, _updateMenuDto: UpdateMenuDto) {
    return {
      message: `This action updates a #${id} menu item`,
    };
  }

  remove(id: string) {
    return { deleted: true, id };
  }
}