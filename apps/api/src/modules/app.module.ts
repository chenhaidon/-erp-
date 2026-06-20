import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { AiModule } from "./ai/ai.module.js";
import { AuditModule } from "./audit/audit.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { DashboardModule } from "./dashboard/dashboard.module.js";
import { EquipmentModule } from "./equipment/equipment.module.js";
import { IntegrationsModule } from "./integrations/integrations.module.js";
import { InventoryModule } from "./inventory/inventory.module.js";
import { MasterDataModule } from "./master-data/master-data.module.js";
import { OrganizationModule } from "./organization/organization.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { ProductionModule } from "./production/production.module.js";
import { QualityModule } from "./quality/quality.module.js";
import { UsersModule } from "./users/users.module.js";
import { ReportsModule } from "./reports/reports.module.js";
import { EventsModule } from "./events/events.module.js";
import { CostsModule } from "./costs/costs.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV}.local`,
        `.env.${process.env.NODE_ENV}`,
        ".env.local",
        ".env"
      ]
    }),
    JwtModule.register({ global: true }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get("REDIS_HOST", "localhost"),
          port: Number(configService.get("REDIS_PORT", 6379))
        }
      })
    }),
    PrismaModule,
    AuditModule,
    EventsModule,
    AuthModule,
    DashboardModule,
    OrganizationModule,
    MasterDataModule,
    ProductionModule,
    InventoryModule,
    QualityModule,
    EquipmentModule,
    IntegrationsModule,
    AiModule,
    UsersModule,
    ReportsModule,
    CostsModule
  ]
})
export class AppModule {}
