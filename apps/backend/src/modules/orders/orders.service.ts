import { Injectable, NotFoundException, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SocketGateway } from '../socket/socket.gateway';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderItemOption } from './entities/order-item-option.entity';
import { Table } from '../tables/entities/table.entity';
import { Product } from '../menu/entities/product.entity';
import { ProductOptionValue } from '../menu/entities/product-option-value.entity';
import { Stock } from '../stock/entities/stock.entity';
import { ProductRecipe } from '../stock/entities/product-recipe.entity';

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    private readonly socketGateway: SocketGateway, // Anlık bildirimler için Global Socket'i enjekte ediyoruz
  ) {}

  onModuleInit() {
    console.log('🛒 [SYSTEM] Orders & Stock Engine successfully initialized.');
  }

  // İşletim Sisteminin Kalbi: Transactional Sipariş ve Stok Entegrasyonu
  async create(createOrderDto: CreateOrderDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction(); // [1]

    try {
      // 1. Adım: Eğer masa siparişi ise masayı doğrula ve durumunu güncelle
      let table: Table | null = null;
      if (createOrderDto.tableId) {
        table = await queryRunner.manager.findOne(Table, {
          where: { id: createOrderDto.tableId },
        });
        if (!table) {
          throw new NotFoundException('Belirtilen masa bulunamadı.');
        }
        table.status = 'ORDERED'; // Masa durumunu "Sipariş Var" yap
        await queryRunner.manager.save(Table, table);
      }

      // 2. Adım: Sipariş ana kaydını oluştur
      const order = queryRunner.manager.create(Order, {
        branchId: createOrderDto.branchId,
        tableId: createOrderDto.tableId,
        waiterId: createOrderDto.waiterId,
        note: createOrderDto.note,
        totalAmount: 0.0, // Alt adımlarda hesaplayıp güncelleyeceğiz
      });
      const savedOrder = await queryRunner.manager.save(Order, order);

      let calculatedTotalAmount = 0.0;

      // 3. Adım: Sipariş kalemlerini ve alt ürün seçeneklerini tek tek işle
      for (const itemDto of createOrderDto.items) {
        // Ürünü ve fiyatını doğrula (İstemci fiyatına asla güvenilmez!)
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: itemDto.productId, isActive: true },
        });
        if (!product) {
          throw new NotFoundException(`Ürün bulunamadı veya pasif: ${itemDto.productId}`);
        }

        let itemSubtotal = Number(product.price) * itemDto.quantity;

        // Sipariş kalemini geçici olarak oluştur
        const orderItem = queryRunner.manager.create(OrderItem, {
          order: savedOrder,
          product,
          quantity: itemDto.quantity,
          unitPrice: Number(product.price),
          subtotal: itemSubtotal,
          note: itemDto.note,
        });
        const savedItem = await queryRunner.manager.save(OrderItem, orderItem);

        // 4. Adım: Eğer ürüne bağlı malzeme reçetesi varsa Stoktan Düşüm Yap
        const recipes = await queryRunner.manager.find(ProductRecipe, {
          where: { productId: product.id },
          relations: { stock: true },
        });

        for (const recipe of recipes) {
          const stockItem = recipe.stock;
          const consumedAmount = Number(recipe.consumedQuantity) * itemDto.quantity;

          // Stok düşüm işlemini yap
          stockItem.quantity = Number(stockItem.quantity) - consumedAmount;
          await queryRunner.manager.save(Stock, stockItem);
        }

        // 5. Adım: Ürünün ekstra opsiyonları varsa (örn: Ekstra Peynir, Soslar) bunları işle
        if (itemDto.options && itemDto.options.length > 0) {
          for (const optDto of itemDto.options) {
            const optValue = await queryRunner.manager.findOne(ProductOptionValue, {
              where: { id: optDto.optionValueId },
            });
            if (!optValue) {
              throw new NotFoundException(`Ürün seçeneği bulunamadı: ${optDto.optionValueId}`);
            }

            const optionPrice = Number(optValue.priceImpact);
            itemSubtotal += optionPrice * itemDto.quantity;

            // Sipariş kalemi seçeneğini kaydet
            const itemOption = queryRunner.manager.create(OrderItemOption, {
              orderItem: savedItem,
              optionValue: optValue,
              price: optionPrice,
            });
            await queryRunner.manager.save(OrderItemOption, itemOption);
          }
        }

        // Kalemin nihai alt toplam tutarını güncelle
        savedItem.subtotal = itemSubtotal;
        await queryRunner.manager.save(OrderItem, savedItem);

        calculatedTotalAmount += itemSubtotal;
      }

      // 6. Adım: Sipariş ana tablosunun toplam tutarını güncelle
      savedOrder.totalAmount = calculatedTotalAmount;
      const finalOrder = await queryRunner.manager.save(Order, savedOrder);

      // İşlemleri kalıcı hale getir [1]
      await queryRunner.commitTransaction();

      // 7. Adım: Şube odasına anlık Socket.io bildirimi fırlat (Mutfak Ekranı KDS anında yakalayacak!)
      this.socketGateway.emitToBranch(createOrderDto.branchId, 'new_order', {
        orderId: finalOrder.id,
        tableId: finalOrder.tableId,
        tableName: table ? table.name : 'Paket Servis',
        totalAmount: finalOrder.totalAmount,
        note: finalOrder.note,
        createdAt: finalOrder.createdAt,
      });

      return {
        message: 'Sipariş başarıyla oluşturuldu ve mutfağa iletildi.',
        orderId: finalOrder.id,
        totalAmount: finalOrder.totalAmount,
      };
    } catch (error) {
      // Bir hata oluştuysa masayı, stoğu ve siparişi eski haline geri al [1]
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Sipariş işlenirken beklenmeyen bir hata oluştu.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  findAll() {
    return `This action returns all active orders`;
  }

  findOne(id: string) {
    return `This action returns a #${id} order`;
  }

  update(id: string, _updateOrderDto: UpdateOrderDto) {
    return {
      message: `This action updates a #${id} order`,
      id,
    };
  }

  remove(id: string) {
    return `This action removes a #${id} order`;
  }
}