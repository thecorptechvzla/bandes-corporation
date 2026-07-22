import { Injectable, Logger, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL no está definida');
    }

    const adapter = new PrismaPg({
      connectionString: url,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    super({ adapter });
  }

  async onModuleInit() {
    try {
      this.logger.log('Conectando a la base de datos...');
      await this.$connect();
      this.logger.log('Conexión establecida correctamente');
    } catch (error) {
      this.logger.error('Error al conectar con la base de datos:', error);
      throw error;
    }
  }

  async onApplicationShutdown() {
    this.logger.log('Cerrando conexión con la base de datos...');
    await this.$disconnect();
    this.logger.log('Conexión cerrada correctamente');
  }
}
