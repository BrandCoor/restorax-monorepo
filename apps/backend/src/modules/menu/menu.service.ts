import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Branch } from '../restaurants/entities/branch.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  async createCategory(data: {
    branchId: string;
    name: string;
    imageUrl?: string;
    isActive?: boolean;
  }) {
    const branch = await this.branchRepository.findOne({ where: { id: data.branchId } });
    if (!branch) throw new NotFoundException('Şube bulunamadı.');
    const category = this.categoryRepository.create({
      name: data.name,
      imageUrl: data.imageUrl,
      isActive: data.isActive ?? true,
      branch,
    });
    return this.categoryRepository.save(category);
  }

  async updateCategory(
    id: string,
    data: { name?: string; imageUrl?: string; isActive?: boolean },
  ) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Kategori bulunamadı.');
    Object.assign(category, data);
    return this.categoryRepository.save(category);
  }

  async removeCategory(id: string) {
    await this.categoryRepository.delete(id);
    return { deleted: true };
  }

  async createProduct(data: {
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    estimatedPrepareTime?: number;
    isActive?: boolean;
  }) {
    const category = await this.categoryRepository.findOne({
      where: { id: data.categoryId },
      relations: { branch: true },
    });
    if (!category) throw new NotFoundException('Kategori bulunamadı.');
    const product = this.productRepository.create({
      name: data.name,
      description: data.description,
      price: data.price,
      imageUrl: data.imageUrl,
      estimatedPrepareTime: data.estimatedPrepareTime,
      isActive: data.isActive ?? true,
      category,
    });
    return this.productRepository.save(product);
  }

  async updateProduct(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      imageUrl?: string;
      estimatedPrepareTime?: number;
      isActive?: boolean;
      categoryId?: string;
    },
  ) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!product) throw new NotFoundException('Ürün bulunamadı.');
    if (data.categoryId) {
      const category = await this.categoryRepository.findOne({ where: { id: data.categoryId } });
      if (!category) throw new NotFoundException('Kategori bulunamadı.');
      product.category = category;
    }
    const { categoryId: _, ...rest } = data;
    Object.assign(product, rest);
    return this.productRepository.save(product);
  }

  async removeProduct(id: string) {
    await this.productRepository.delete(id);
    return { deleted: true };
  }

  async findAllByBranch(branchId: string) {
    return this.categoryRepository.find({
      where: { branch: { id: branchId }, isActive: true },
      relations: { products: true },
      order: { name: 'ASC' },
    });
  }

  async findAllByBranchAdmin(branchId: string) {
    return this.categoryRepository.find({
      where: { branch: { id: branchId } },
      relations: { products: true },
      order: { name: 'ASC' },
    });
  }

  async findAll() {
    return this.categoryRepository.find({ relations: { products: true } });
  }

  findOne(id: string) {
    return this.productRepository.findOne({
      where: { id },
      relations: { category: true, options: { values: true } },
    });
  }
}
