import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Branch } from '../restaurants/entities/branch.entity';
import { TableSection } from '../tables/entities/table-section.entity';
import { Table } from '../tables/entities/table.entity';
import { Category } from '../menu/entities/category.entity';
import { Product } from '../menu/entities/product.entity';
import { Stock } from '../stock/entities/stock.entity';
import { ProductRecipe } from '../stock/entities/product-recipe.entity';
import { Employee } from '../employees/entities/employee.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly dataSource: DataSource, // İlişkisel seeder için ana veri kaynağı
  ) {}

  async onModuleInit() {
    await this.seedRoles();
    await this.seedDefaultData();
  }

  // 1. Tohumlama: Temel Roller
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
        console.log('✅ [SEED] Default roles successfully created: SUPER_ADMIN, OWNER, MANAGER, WAITER, KITCHEN');
      }
    } catch (error) {
      console.error('❌ [SEED ERROR] Failed to seed default roles:', error);
    }
  }

  // 2. Tohumlama: SaaS Demo Verileri (Masa, Menü, Stok, Reçete ve Kullanıcı)
  private async seedDefaultData() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction(); // [1]

    try {
      // Zaten bir yönetici kayıtlı mı kontrol et
      const existingUser = await queryRunner.manager.findOne(User, {
        where: { email: 'owner@burgerx.com' },
      });

      if (!existingUser) {
        console.log('⚙️ [SEED] Creating default restaurant, menu, stock and tables...');

        // A. Restoran Oluştur
        const restaurant = queryRunner.manager.create(Restaurant, {
          name: 'BurgerX',
          subdomain: 'burgerx',
        });
        const savedRestaurant = await queryRunner.manager.save(Restaurant, restaurant);

        // B. Şube Oluştur
        const branch = queryRunner.manager.create(Branch, {
          name: 'Körfez Şubesi',
          restaurant: savedRestaurant,
        });
        const savedBranch = await queryRunner.manager.save(Branch, branch);

        // C. Masa Bölümleri (Table Sections) Oluştur
        const sectionSalon = queryRunner.manager.create(TableSection, {
          name: 'Salon',
          branch: savedBranch,
        });
        const savedSectionSalon = await queryRunner.manager.save(TableSection, sectionSalon);

        const sectionBahce = queryRunner.manager.create(TableSection, {
          name: 'Bahçe',
          branch: savedBranch,
        });
        const savedSectionBahce = await queryRunner.manager.save(TableSection, sectionBahce);

        // D. Masaları (Tables) Oluştur
        const tablesToCreate = [
          { name: 'Masa 1', capacity: 4, section: savedSectionSalon },
          { name: 'Masa 2', capacity: 4, section: savedSectionSalon },
          { name: 'Bahçe 1', capacity: 6, section: savedSectionBahce },
        ];
        for (const t of tablesToCreate) {
          const tbl = queryRunner.manager.create(Table, t);
          await queryRunner.manager.save(Table, tbl);
        }

        // E. Hammadde Stoklarını (Stock) Oluştur
        const stockKofte = queryRunner.manager.create(Stock, {
          ingredientName: 'Dana Köfte',
          quantity: 100, // 100 adet köfte
          unit: 'PIECE',
          branch: savedBranch,
        });
        const savedStockKofte = await queryRunner.manager.save(Stock, stockKofte);

        const stockEkmek = queryRunner.manager.create(Stock, {
          ingredientName: 'Burger Ekmeği',
          quantity: 100, // 100 adet burger ekmeği
          unit: 'PIECE',
          branch: savedBranch,
        });
        const savedStockEkmek = await queryRunner.manager.save(Stock, stockEkmek);

        // F. Menü Kategorilerini (Categories) Oluştur
        const catBurger = queryRunner.manager.create(Category, {
          name: 'Burgerler',
          branch: savedBranch,
        });
        const savedCatBurger = await queryRunner.manager.save(Category, catBurger);

        const catIcecek = queryRunner.manager.create(Category, {
          name: 'İçecekler',
          branch: savedBranch,
        });
        const savedCatIcecek = await queryRunner.manager.save(Category, catIcecek);

        // G. Menü Ürünlerini (Products) Oluştur
        const prodBurger = queryRunner.manager.create(Product, {
          name: 'Klasik Burger',
          description: '150g ev yapımı dana köfte, cheddar peyniri, özel sos',
          price: 250.00,
          category: savedCatBurger,
        });
        const savedProdBurger = await queryRunner.manager.save(Product, prodBurger);

        const prodKola = queryRunner.manager.create(Product, {
          name: 'Kutu Kola',
          description: 'Soğuk meşrubat',
          price: 50.00,
          category: savedCatIcecek,
        });
        await queryRunner.manager.save(Product, prodKola);

        // H. Ürün Reçetelerini (Product Recipes) Oluştur
        // Klasik Burger satılınca 1 adet Dana Köfte düşecek
        const recKofte = queryRunner.manager.create(ProductRecipe, {
          product: savedProdBurger,
          stock: savedStockKofte,
          consumedQuantity: 1.000,
        });
        await queryRunner.manager.save(ProductRecipe, recKofte);

        // Klasik Burger satılınca 1 adet Burger Ekmeği düşecek
        const recEkmek = queryRunner.manager.create(ProductRecipe, {
          product: savedProdBurger,
          stock: savedStockEkmek,
          consumedQuantity: 1.000,
        });
        await queryRunner.manager.save(ProductRecipe, recEkmek);

        // I. Owner Kullanıcısını Oluştur
        const ownerRole = await queryRunner.manager.findOne(Role, {
          where: { name: 'OWNER' },
        });
        if (!ownerRole) {
          throw new Error('Owner role not found during seeding');
        }

        const passwordHash = await bcrypt.hash('burgerx123', 10);
        const ownerUser = queryRunner.manager.create(User, {
          email: 'owner@burgerx.com',
          passwordHash,
          firstName: 'Kaan',
          lastName: 'Yılmaz',
          phone: '05555555555',
          role: ownerRole,
        });
        const savedOwnerUser = await queryRunner.manager.save(User, ownerUser);

        // J. Kullanıcıyı Şubeye Çalışan (Yönetici) Olarak Bağla
        const employee = queryRunner.manager.create(Employee, {
          user: savedOwnerUser,
          branch: savedBranch,
        });
        await queryRunner.manager.save(Employee, employee);

        // Değişiklikleri kalıcı hale getir [1]
        await queryRunner.commitTransaction();
        console.log('✅ [SEED] Default restaurant data, stock items, menu items, recipes and owner user successfully created!');
      }
    } catch (error) {
      // Bir hata olursa yapılan her şeyi geri al [1]
      await queryRunner.rollbackTransaction();
      console.error('❌ [SEED ERROR] Failed to seed default restaurant data:', error);
    } finally {
      await queryRunner.release();
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