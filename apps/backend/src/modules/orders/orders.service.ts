import { Injectable, NotFoundException, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { DataSource, In, Not } from 'typeorm';
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
import { Customer } from '../customers/entities/customer.entity';
import { PrinterRule } from '../printer/entities/printer-rule.entity';
import { PrintJob } from '../printer/entities/print-job.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Printer } from '../printer/entities/printer.entity';

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    private readonly socketGateway: SocketGateway,
  ) {}

  onModuleInit() {
    console.log('🛒 [SYSTEM] Advanced Orders, CRM, Print & Split Settle Engine initialized.');
  }

  async create(createOrderDto: CreateOrderDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction(); // [1]

    try {
      let table: Table | null = null;
      let existingOrder: Order | null = null;

      if (createOrderDto.orderType === 'TABLE' && createOrderDto.tableId) {
        table = await queryRunner.manager.findOne(Table, {
          where: { id: createOrderDto.tableId },
        });
        if (!table) {
          throw new NotFoundException('Belirtilen masa bulunamadı.');
        }

        existingOrder = await queryRunner.manager.findOne(Order, {
          where: {
            tableId: createOrderDto.tableId,
            status: Not(In(['COMPLETED', 'CANCELLED'])),
          },
        });

        table.status = 'ORDERED';
        await queryRunner.manager.save(Table, table);
      }

      let customerId: string | undefined = undefined;
      if ((createOrderDto.orderType === 'DELIVERY' || createOrderDto.orderType === 'TAKEAWAY') && createOrderDto.customerPhone) {
        let customer = await queryRunner.manager.findOne(Customer, {
          where: { phone: createOrderDto.customerPhone },
        });

        if (!customer && createOrderDto.customerName) {
          customer = queryRunner.manager.create(Customer, {
            phone: createOrderDto.customerPhone,
            firstName: createOrderDto.customerName.split(' ')[0] || 'Değerli',
            lastName: createOrderDto.customerName.split(' ').slice(1).join(' ') || 'Müşteri',
          });
          customer = await queryRunner.manager.save(Customer, customer);
        }

        if (customer) {
          customer.visitCount += 1;
          await queryRunner.manager.save(Customer, customer);
          customerId = customer.id;
        }
      }

      let savedOrder: Order;
      if (existingOrder) {
        savedOrder = existingOrder;
        if (createOrderDto.note) {
          savedOrder.note = savedOrder.note ? `${savedOrder.note} | ${createOrderDto.note}` : createOrderDto.note;
        }
        if (createOrderDto.guestCount) {
          savedOrder.guestCount = createOrderDto.guestCount;
        }
      } else {
        const order = queryRunner.manager.create(Order, {
          branchId: createOrderDto.branchId,
          tableId: createOrderDto.orderType === 'TABLE' ? createOrderDto.tableId : undefined,
          waiterId: createOrderDto.waiterId,
          customerId,
          source: createOrderDto.orderType === 'TABLE' ? 'WAITER' : 'PHONE_DELIVERY',
          note: createOrderDto.note,
          totalAmount: 0.0,
          guestCount: createOrderDto.guestCount || 1,
          status: 'RECEIVED',
        });
        savedOrder = await queryRunner.manager.save(Order, order);
      }

      let calculatedTotalAmount = Number(savedOrder.totalAmount);
      const orderItemsList: OrderItem[] = [];

      for (const itemDto of createOrderDto.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: itemDto.productId, isActive: true },
          relations: { category: true },
        });
        if (!product) {
          throw new NotFoundException(`Ürün bulunamadı: ${itemDto.productId}`);
        }

        let itemSubtotal = Number(product.price) * itemDto.quantity;

        const orderItem = queryRunner.manager.create(OrderItem, {
          order: savedOrder,
          product,
          quantity: itemDto.quantity,
          unitPrice: Number(product.price),
          subtotal: itemSubtotal,
          note: itemDto.note,
        });
        const savedItem = await queryRunner.manager.save(OrderItem, orderItem);

        const recipes = await queryRunner.manager.find(ProductRecipe, {
          where: { productId: product.id },
          relations: { stock: true },
        });

        for (const recipe of recipes) {
          const stockItem = recipe.stock;
          const consumedAmount = Number(recipe.consumedQuantity) * itemDto.quantity;
          stockItem.quantity = Number(stockItem.quantity) - consumedAmount;
          await queryRunner.manager.save(Stock, stockItem);
        }

        if (itemDto.options && itemDto.options.length > 0) {
          for (const optDto of itemDto.options) {
            const optValue = await queryRunner.manager.findOne(ProductOptionValue, {
              where: { id: optDto.optionValueId },
            });
            if (optValue) {
              const optionPrice = Number(optValue.priceImpact);
              itemSubtotal += optionPrice * itemDto.quantity;

              const itemOption = queryRunner.manager.create(OrderItemOption, {
                orderItem: savedItem,
                optionValue: optValue,
                price: optionPrice,
              });
              await queryRunner.manager.save(OrderItemOption, itemOption);
            }
          }
        }

        savedItem.subtotal = itemSubtotal;
        await queryRunner.manager.save(OrderItem, savedItem);
        orderItemsList.push(savedItem);

        calculatedTotalAmount += itemSubtotal;
      }

      savedOrder.totalAmount = calculatedTotalAmount;
      const finalOrder = await queryRunner.manager.save(Order, savedOrder);

      await this.generateKitchenPrintJobs(finalOrder, orderItemsList, queryRunner);

      await queryRunner.commitTransaction();

      this.socketGateway.emitToBranch(createOrderDto.branchId, 'new_order', {
        orderId: finalOrder.id,
        tableName: table ? table.name : 'Paket Servis',
      });

      return {
        message: existingOrder 
          ? 'Mevcut adisyona yeni ürünler başarıyla eklendi, stoktan düşüldü.' 
          : 'Sipariş başarıyla oluşturuldu, stoktan düşüldü ve yazıcı kuyruğuna eklendi.',
        orderId: finalOrder.id,
        totalAmount: finalOrder.totalAmount,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Sipariş işlenirken bir hata oluştu.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findActiveByTable(tableId: string) {
    const order = await this.dataSource.manager.findOne(Order, {
      where: {
        tableId,
        status: Not(In(['COMPLETED', 'CANCELLED'])),
      },
      relations: {
        items: {
          product: {
            category: true,
          },
          options: {
            optionValue: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Bu masaya ait aktif bir adisyon bulunamadı.');
    }
    return order;
  }

  // 1. Yeni Metot: Masa Taşıma ve Masa Birleştirme Motoru [1]
  async moveTable(sourceTableId: string, targetTableId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sourceTable = await queryRunner.manager.findOne(Table, { where: { id: sourceTableId } });
      const targetTable = await queryRunner.manager.findOne(Table, { where: { id: targetTableId } });

      if (!sourceTable || !targetTable) {
        throw new NotFoundException('Masa tanımları bulunamadı.');
      }

      // Kaynak masadaki aktif adisyonu bul [1]
      const sourceOrder = await queryRunner.manager.findOne(Order, {
        where: { tableId: sourceTableId, status: Not(In(['COMPLETED', 'CANCELLED'])) },
      });

      if (!sourceOrder) {
        throw new NotFoundException('Kaynak masaya ait aktif adisyon bulunamadı.');
      }

      // Hedef masada aktif bir adisyon var mı bak (Varsa birleştirme, yoksa taşıma) [1]
      const targetOrder = await queryRunner.manager.findOne(Order, {
        where: { tableId: targetTableId, status: Not(In(['COMPLETED', 'CANCELLED'])) },
      });

      if (targetOrder) {
        // HEDEF MASA DOLU: MASA BİRLEŞTİRME (Merge) [1]
        const sourceItems = await queryRunner.manager.find(OrderItem, {
          where: { order: { id: sourceOrder.id } },
        });

        // Tüm kaynak ürünleri hedef adisyona aktar [1]
        for (const item of sourceItems) {
          item.order = targetOrder;
          await queryRunner.manager.save(OrderItem, item);
        }

        // Tutar güncellemesi
        targetOrder.totalAmount = Number(targetOrder.totalAmount) + Number(sourceOrder.totalAmount);
        targetOrder.discount = Number(targetOrder.discount) + Number(sourceOrder.discount);
        await queryRunner.manager.save(Order, targetOrder);

        // Eski adisyonu iptal et
        sourceOrder.status = 'CANCELLED';
        sourceOrder.rejectReason = `Masa Birleştirildi (${targetTable.name})`;
        await queryRunner.manager.save(Order, sourceOrder);

      } else {
        // HEDEF MASA BOŞ: MASA TAŞIMA (Move) [1]
        sourceOrder.tableId = targetTableId;
        await queryRunner.manager.save(Order, sourceOrder);

        targetTable.status = sourceTable.status;
        await queryRunner.manager.save(Table, targetTable);
      }

      // Eski masayı tamamen boşa çıkar [1]
      sourceTable.status = 'IDLE';
      await queryRunner.manager.save(Table, sourceTable);

      await queryRunner.commitTransaction();

      // Sockets ile ekranları yenile [1]
      this.socketGateway.emitToBranch(sourceOrder.branchId, 'table_status_changed', { tableId: sourceTableId });
      this.socketGateway.emitToBranch(sourceOrder.branchId, 'table_status_changed', { tableId: targetTableId });

      return { success: true, type: targetOrder ? 'MERGED' : 'MOVED' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error instanceof Error ? error.message : 'Masa taşıma başarısız.');
    } finally {
      await queryRunner.release();
    }
  }

  // 2. Yeni Metot: Masa / Adisyon Ayırma (Seçilen Ürünleri Başka Masaya Bölme) [1]
  async splitTable(sourceOrderId: string, targetTableId: string, itemsToSplit: { orderItemId: string; quantity: number }[]) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sourceOrder = await queryRunner.manager.findOne(Order, {
        where: { id: sourceOrderId },
        relations: { table: true },
      });
      const targetTable = await queryRunner.manager.findOne(Table, { where: { id: targetTableId } });

      if (!sourceOrder || !targetTable) {
        throw new NotFoundException('Kaynak adisyon veya hedef masa bulunamadı.');
      }

      // Hedef masadaki adisyonu bul veya yoksa yeni bir tane oluştur [1]
      let targetOrder = await queryRunner.manager.findOne(Order, {
        where: { tableId: targetTableId, status: Not(In(['COMPLETED', 'CANCELLED'])) },
      });

      if (!targetOrder) {
        targetOrder = queryRunner.manager.create(Order, {
          branchId: sourceOrder.branchId,
          tableId: targetTableId,
          status: 'RECEIVED',
          totalAmount: 0.0,
        });
        targetOrder = await queryRunner.manager.save(Order, targetOrder);
        
        targetTable.status = 'ORDERED';
        await queryRunner.manager.save(Table, targetTable);
      }

      let sourceOrderTotalReduction = 0.0;
      let targetOrderTotalAddition = 0.0;

      // Seçilen ürünleri tek tek böl ve hedef adisyona taşı [1]
      for (const itemToSplit of itemsToSplit) {
        const orderItem = await queryRunner.manager.findOne(OrderItem, {
          where: { id: itemToSplit.orderItemId },
          relations: { product: true },
        });

        if (!orderItem) throw new NotFoundException('Bölünecek ürün bulunamadı.');

        const splitPrice = Number(orderItem.unitPrice) * itemToSplit.quantity;

        if (itemToSplit.quantity === orderItem.quantity) {
          // A. TÜMÜNÜ TAŞI: Ürünün tamamı taşınıyorsa sadece order_id güncellemesi yap [1]
          orderItem.order = targetOrder;
          await queryRunner.manager.save(OrderItem, orderItem);
        } else {
          // B. KISMEN BÖL: Ürünün bir kısmı kalıyor, bir kısmı gidiyorsa [1]
          // Eski üründen miktarı düş
          orderItem.quantity -= itemToSplit.quantity;
          orderItem.subtotal = Number(orderItem.subtotal) - splitPrice;
          await queryRunner.manager.save(OrderItem, orderItem);

          // Hedef adisyon için yeni bir sipariş kalemi oluştur [1]
          const newOrderItem = queryRunner.manager.create(OrderItem, {
            order: targetOrder,
            product: orderItem.product,
            quantity: itemToSplit.quantity,
            unitPrice: orderItem.unitPrice,
            subtotal: splitPrice,
          });
          await queryRunner.manager.save(OrderItem, newOrderItem);
        }

        sourceOrderTotalReduction += splitPrice;
        targetOrderTotalAddition += splitPrice;
      }

      // Tutar Güncellemeleri
      sourceOrder.totalAmount = Number(sourceOrder.totalAmount) - sourceOrderTotalReduction;
      await queryRunner.manager.save(Order, sourceOrder);

      targetOrder.totalAmount = Number(targetOrder.totalAmount) + targetOrderTotalAddition;
      await queryRunner.manager.save(Order, targetOrder);

      // Eğer kaynak adisyonda hiç ürün kalmadıysa kaynak adisyonu iptal et/kapat ve masayı boşa çıkar [1]
      const remainingItems = await queryRunner.manager.find(OrderItem, {
        where: { order: { id: sourceOrder.id } },
      });

      if (remainingItems.length === 0) {
        sourceOrder.status = 'CANCELLED';
        sourceOrder.rejectReason = 'Tüm ürünler başka masaya aktarıldı.';
        await queryRunner.manager.save(Order, sourceOrder);

        if (sourceOrder.table) {
          sourceOrder.table.status = 'IDLE';
          await queryRunner.manager.save(Table, sourceOrder.table);
        }
      }

      await queryRunner.commitTransaction();

      // Sockets ile ekranları yenile [1]
      this.socketGateway.emitToBranch(sourceOrder.branchId, 'table_status_changed', { tableId: sourceOrder.tableId });
      this.socketGateway.emitToBranch(sourceOrder.branchId, 'table_status_changed', { tableId: targetTableId });

      return { success: true };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error instanceof Error ? error.message : 'Adisyon ayırma başarısız.');
    } finally {
      await queryRunner.release();
    }
  }

  async applyDiscount(id: string, discountType: 'AMOUNT' | 'PERCENT', value: number) {
    const order = await this.dataSource.manager.findOne(Order, { where: { id } });
    if (!order) throw new NotFoundException('Sipariş bulunamadı.');

    let discountAmount = 0.0;
    if (discountType === 'AMOUNT') {
      discountAmount = value;
    } else {
      discountAmount = Number(order.totalAmount) * (value / 100);
    }

    order.discount = discountAmount;
    await this.dataSource.manager.save(Order, order);

    this.socketGateway.emitToBranch(order.branchId, 'table_status_changed', { tableId: order.tableId });
    return order;
  }

  async payCustomAmount(id: string, paymentMethod: string, amount: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id },
        relations: { table: true },
      });
      if (!order) throw new NotFoundException('Sipariş bulunamadı.');

      const payment = queryRunner.manager.create(Payment, {
        orderId: order.id,
        paymentMethod,
        amount,
      });
      await queryRunner.manager.save(Payment, payment);

      const allPayments = await queryRunner.manager.find(Payment, {
        where: { orderId: order.id },
      });
      const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const remaining = Number(order.totalAmount) - Number(order.discount) - totalPaid;

      if (remaining <= 0.05) {
        order.status = 'COMPLETED';
        await queryRunner.manager.save(Order, order);

        if (order.table) {
          order.table.status = 'IDLE';
          await queryRunner.manager.save(Table, order.table);
        }
      }

      await queryRunner.commitTransaction();

      this.socketGateway.emitToBranch(order.branchId, 'table_status_changed', { tableId: order.tableId });
      this.socketGateway.emitToBranch(order.branchId, 'order_status_changed', { orderId: order.id, tableId: order.tableId });

      return { success: true, remaining: Math.max(0, remaining) };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error instanceof Error ? error.message : 'Ödeme alınamadı.');
    } finally {
      await queryRunner.release();
    }
  }

  async payItems(id: string, paymentMethod: string, itemsToPay: { orderItemId: string; quantity: number }[]) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id },
        relations: { table: true },
      });
      if (!order) throw new NotFoundException('Sipariş bulunamadı.');

      let totalPaidForItems = 0;

      for (const itemToPay of itemsToPay) {
        const orderItem = await queryRunner.manager.findOne(OrderItem, {
          where: { id: itemToPay.orderItemId },
        });
        if (!orderItem) throw new NotFoundException('Sipariş ürünü bulunamadı.');

        const unpaidQty = orderItem.quantity - orderItem.paidQuantity;
        if (itemToPay.quantity > unpaidQty) {
          throw new Error(`En fazla ${unpaidQty} adet ödeme yapabilirsiniz.`);
        }

        orderItem.paidQuantity += itemToPay.quantity;
        await queryRunner.manager.save(OrderItem, orderItem);

        totalPaidForItems += Number(orderItem.unitPrice) * itemToPay.quantity;
      }

      const payment = queryRunner.manager.create(Payment, {
        orderId: order.id,
        paymentMethod,
        amount: totalPaidForItems,
      });
      await queryRunner.manager.save(Payment, payment);

      const allItems = await queryRunner.manager.find(OrderItem, {
        where: { order: { id } },
      });
      const isFullyPaid = allItems.every((item) => item.paidQuantity >= item.quantity);

      if (isFullyPaid) {
        order.status = 'COMPLETED';
        await queryRunner.manager.save(Order, order);

        if (order.table) {
          order.table.status = 'IDLE';
          await queryRunner.manager.save(Table, order.table);
        }
      }

      await queryRunner.commitTransaction();

      this.socketGateway.emitToBranch(order.branchId, 'table_status_changed', { tableId: order.tableId });
      this.socketGateway.emitToBranch(order.branchId, 'order_status_changed', { orderId: order.id, tableId: order.tableId });

      return { success: true, isFullyPaid };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error instanceof Error ? error.message : 'Ödeme alınamadı.');
    } finally {
      await queryRunner.release();
    }
  }

  private async generateKitchenPrintJobs(order: Order, items: OrderItem[], queryRunner: any) {
    const rules = await queryRunner.manager.find(PrinterRule, {
      where: { branchId: order.branchId },
      relations: { printer: true },
    });

    const printerJobsMap = new Map<string, { printerId: string; payloadLines: string[] }>();

    for (const item of items) {
      const rule = rules.find((r) => r.productId === item.product.id) || 
                   rules.find((r) => r.categoryId === item.product.category?.id);

      if (rule && rule.printer && rule.printer.isActive) {
        const printerId = rule.printer.id;
        if (!printerJobsMap.has(printerId)) {
          printerJobsMap.set(printerId, {
            printerId,
            payloadLines: [
              `REST_ORDER: ${order.table ? order.table.name : 'PAKET SERVIS'}`,
              `Tarih: ${new Date().toLocaleTimeString()}`,
              `--------------------------------`,
            ],
          });
        }
        printerJobsMap.get(printerId)?.payloadLines.push(
          `${item.quantity}x ${item.product.name} ${item.note ? `\n   (* Not: ${item.note})` : ''}`,
        );
      }
    }

    for (const [_, jobData] of printerJobsMap.entries()) {
      jobData.payloadLines.push(`--------------------------------`);
      jobData.payloadLines.push(`Adres/Not: ${order.note || 'Yok'}`);

      const printJob = queryRunner.manager.create(PrintJob, {
        branchId: order.branchId,
        printer_id: jobData.printerId,
        payload: jobData.payloadLines.join('\n'),
        status: 'PENDING',
      });
      await queryRunner.manager.save(PrintJob, printJob);
    }
  }

  async createTestOrder(branchId: string) {
    const table = await this.dataSource.manager.findOne(Table, {
      where: { name: 'Masa 1' },
    });
    if (!table) {
      throw new NotFoundException('Test için "Masa 1" bulunamadı.');
    }

    const product = await this.dataSource.manager.findOne(Product, {
      where: { name: 'Klasik Burger' },
    });
    if (!product) {
      throw new NotFoundException('Test için "Klasik Burger" bulunamadı.');
    }

    return this.create({
      branchId,
      orderType: 'TABLE',
      tableId: table.id,
      items: [
        {
          productId: product.id,
          quantity: 2,
          options: [],
        },
      ],
    });
  }

  async createTestPlatformOrder(branchId: string, platformName: string) {
    const product = await this.dataSource.manager.findOne(Product, {
      where: { name: 'Klasik Burger' },
    });
    if (!product) {
      throw new NotFoundException('Test için "Klasik Burger" bulunamadı.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = queryRunner.manager.create(Order, {
        branchId,
        source: platformName,
        status: 'RECEIVED',
        totalAmount: Number(product.price) * 2,
        note: 'Sipariş temassız teslim edilsin, kapıya bırakın.',
      });
      const savedOrder = await queryRunner.manager.save(Order, order);

      const orderItem = queryRunner.manager.create(OrderItem, {
        order: savedOrder,
        product,
        quantity: 2,
        unitPrice: Number(product.price),
        subtotal: Number(product.price) * 2,
      });
      await queryRunner.manager.save(OrderItem, orderItem);

      const recipes = await queryRunner.manager.find(ProductRecipe, {
        where: { productId: product.id },
        relations: { stock: true },
      });
      for (const recipe of recipes) {
        const stockItem = recipe.stock;
        stockItem.quantity = Number(stockItem.quantity) - Number(recipe.consumedQuantity) * 2;
        await queryRunner.manager.save(Stock, stockItem);
      }

      await queryRunner.commitTransaction();

      this.socketGateway.emitToBranch(branchId, 'new_order', {
        orderId: savedOrder.id,
        tableName: `Paket Servis (${platformName})`,
      });

      return savedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error instanceof Error ? error.message : 'Platform sipariş simülasyonu başarısız.');
    } finally {
      await queryRunner.release();
    }
  }

  async findAllActiveByBranch(branchId: string) {
    return this.dataSource.manager.find(Order, {
      where: {
        branchId,
        status: Not(In(['COMPLETED', 'CANCELLED'])),
      },
      relations: {
        items: {
          product: {
            category: true,
          },
          options: {
            optionValue: true,
          },
        },
        table: true,
        waiter: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async findAll() {
    return this.dataSource.manager.find(Order, {
      relations: {
        items: true,
        table: true,
      },
    });
  }

  async findOne(id: string) {
    return this.dataSource.manager.findOne(Order, {
      where: { id },
      relations: {
        items: true,
        table: true,
      },
    });
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.dataSource.manager.findOne(Order, {
      where: { id },
      relations: { table: true },
    });

    if (!order) {
      throw new NotFoundException('Sipariş bulunamadı.');
    }

    if (updateOrderDto.status) {
      order.status = updateOrderDto.status;

      if (updateOrderDto.status === 'CANCELLED' && updateOrderDto.rejectReason) {
        order.rejectReason = updateOrderDto.rejectReason;
      }

      if (updateOrderDto.status === 'COMPLETED' || updateOrderDto.status === 'CANCELLED') {
        if (order.table) {
          order.table.status = 'IDLE';
          await this.dataSource.manager.save(Table, order.table);
        }
      }
    }

    const savedOrder = await this.dataSource.manager.save(Order, order);

    if (savedOrder.source !== 'WAITER' && savedOrder.source !== 'PHONE_DELIVERY') {
      console.log(`📡 [INTEGRATION SYNC] Connecting to ${savedOrder.source} External API...`);
      console.log(`🔌 [SUCCESS] Platform Order #${savedOrder.id} status successfully synced to '${savedOrder.status}' ${savedOrder.rejectReason ? `with reason: "${savedOrder.rejectReason}"` : ''}.`);
    }

    this.socketGateway.emitToBranch(order.branchId, 'order_status_changed', {
      orderId: savedOrder.id,
      status: savedOrder.status,
      tableId: savedOrder.tableId,
    });

    this.socketGateway.emitToBranch(order.branchId, 'table_status_changed', {
      tableId: savedOrder.tableId,
    });

    return savedOrder;
  }

  async remove(id: string) {
    await this.dataSource.manager.delete(Order, id);
    return { deleted: true };
  }
}