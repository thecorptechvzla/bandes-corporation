import { Catch, ExceptionFilter, ArgumentsHost, Logger, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError, Prisma.PrismaClientInitializationError, Prisma.PrismaClientRustPanicError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'DB_ERROR';
    let message = 'Error interno de base de datos';

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          code = 'UNIQUE_CONSTRAINT';
          message = 'Ya existe un registro con ese valor';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          code = 'NOT_FOUND';
          message = 'Registro no encontrado';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          code = 'FOREIGN_KEY_ERROR';
          message = 'El registro relacionado no existe';
          break;
        case 'P2014':
          status = HttpStatus.BAD_REQUEST;
          code = 'RELATION_ERROR';
          message = 'Violación de relación en base de datos';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          code = `PRISMA_${exception.code}`;
          message = 'Error en la operación de base de datos';
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      code = 'VALIDATION_ERROR';
      message = 'Datos inválidos para la operación en base de datos';
    } else if (exception instanceof Prisma.PrismaClientInitializationError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      code = 'DB_INIT_ERROR';
      message = 'No se pudo conectar con la base de datos';
    } else if (exception instanceof Prisma.PrismaClientRustPanicError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'DB_PANIC';
      message = 'Error crítico en el motor de base de datos';
    }

    this.logger.error(`[${code}] ${message}`, exception.stack);

    response.status(status).json({
      statusCode: status,
      error: code,
      message,
    });
  }
}
