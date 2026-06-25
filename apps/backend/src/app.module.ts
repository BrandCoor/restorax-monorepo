import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { TablesModule } from './modules/tables/tables.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PrinterModule } from './modules/printer/printer.module';
import { StockModule } from './modules/stock/stock.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { CustomersModule } from './modules/customers/customers.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuthModule } from './modules/auth/auth.module';
import { SocketModule } from './modules/socket/socket.module'; // Socket modülü eklendi

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
    }),
    UsersModule,
    RestaurantsModule,
    TablesModule,
    MenuModule,
    OrdersModule,
    PaymentsModule,
    PrinterModule,
    StockModule,
    EmployeesModule,
    CustomersModule,
    IntegrationsModule,
    ReportsModule,
    AuthModule,
    SocketModule, // Socket modülü buraya bağlandı
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
