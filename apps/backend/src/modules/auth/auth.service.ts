import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Branch } from '../restaurants/entities/branch.entity';
import { Employee } from '../employees/entities/employee.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  // 1. SaaS İşlemi: Restoran, Şube, Kullanıcı ve İlişkileri Tek Seferde ve Güvenle Oluşturma
  async register(registerDto: RegisterDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction(); // İşlemi (Transaction) başlat [1]

    try {
      // E-posta kullanımda mı kontrol et
      const existingUser = await queryRunner.manager.findOne(User, {
        where: { email: registerDto.email },
      });
      if (existingUser) {
        throw new ConflictException('Bu e-posta adresi zaten kullanımda.');
      }

      // Subdomain kullanımda mı kontrol et
      const existingRestaurant = await queryRunner.manager.findOne(Restaurant, {
        where: { subdomain: registerDto.subdomain },
      });
      if (existingRestaurant) {
        throw new ConflictException(
          'Bu restoran alan adı (subdomain) zaten alınmış.',
        );
      }

      // Adım A: Restoranı oluştur
      const restaurant = queryRunner.manager.create(Restaurant, {
        name: registerDto.restaurantName,
        subdomain: registerDto.subdomain,
      });
      const savedRestaurant = await queryRunner.manager.save(
        Restaurant,
        restaurant,
      );

      // Adım B: Şubeyi oluştur ve restorana bağla
      const branch = queryRunner.manager.create(Branch, {
        name: registerDto.branchName,
        restaurant: savedRestaurant,
      });
      const savedBranch = await queryRunner.manager.save(Branch, branch);

      // Adım C: OWNER (İşletme Sahibi) rolünü bul
      const ownerRole = await queryRunner.manager.findOne(Role, {
        where: { name: 'OWNER' },
      });
      if (!ownerRole) {
        throw new ConflictException('Sistemde OWNER rolü tanımlı değil.');
      }

      // Adım D: Şifreyi güvenli bir şekilde hash'le
      const passwordHash = await bcrypt.hash(registerDto.password, 10);

      // Adım E: Kullanıcıyı oluştur ve rolünü bağla
      const user = queryRunner.manager.create(User, {
        email: registerDto.email,
        passwordHash,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        role: ownerRole,
      });
      const savedUser = await queryRunner.manager.save(User, user);

      // Adım F: Kullanıcıyı şubeye çalışan (Yönetici) olarak kaydet
      const employee = queryRunner.manager.create(Employee, {
        user: savedUser,
        branch: savedBranch,
      });
      await queryRunner.manager.save(Employee, employee);

      // Her şey başarılıysa veritabanı değişikliklerini kalıcı hale getir [1]
      await queryRunner.commitTransaction();

      return {
        message: 'Kayıt işlemi başarıyla tamamlandı.',
        userId: savedUser.id,
        restaurantId: savedRestaurant.id,
        branchId: savedBranch.id,
      };
    } catch (error) {
      // Bir hata oluştuysa yapılan tüm işlemleri (Restoran, şube dahil) geri al [1]
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Bağlantıyı serbest bırak
      await queryRunner.release();
    }
  }

  // 2. Giriş İşlemi: Şifre Kontrolü ve Güvenli JWT Token Üretme
  async login(loginDto: LoginDto) {
    const user = await this.dataSource.manager.findOne(User, {
      where: { email: loginDto.email, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('Geçersiz e-posta veya şifre.');
    }

    // Şifreyi doğrula
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Geçersiz e-posta veya şifre.');
    }

    // TypeORM 0.3.x+ sürümünde iç içe ilişkiler (Nested Relations) nesne formatında çekilmelidir.
    const employee = await this.dataSource.manager.findOne(Employee, {
      where: { userId: user.id },
      relations: {
        branch: {
          restaurant: true,
        },
      },
    });

    // JWT token içeriğini (Payload) hazırla
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      restaurantId: employee?.branch?.restaurant?.id || null,
      branchId: employee?.branch?.id || null,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        restaurantId: payload.restaurantId,
        branchId: payload.branchId,
      },
    };
  }
}
