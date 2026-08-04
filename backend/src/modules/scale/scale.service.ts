import {
  Injectable,
  ConflictException,
  RequestTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

const DEFAULT_TIMEOUT_MS = 5000;

@Injectable()
export class ScaleService {
  async readWeight(): Promise<{ weight: number }> {
    const path = process.env.SCALE_PORT || '/dev/ttyUSB0';
    const baudRate = Number(process.env.SCALE_BAUD_RATE || '9600');

    return new Promise<{ weight: number }>((resolve, reject) => {
      const port = new SerialPort({ path, baudRate, autoOpen: false });
      const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
      let timer: NodeJS.Timeout | null = null;
      let settled = false;

      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        try {
          port.close(() => {});
        } catch {
          // puerto ya cerrado
        }
        fn();
      };

      timer = setTimeout(() => {
        finish(() =>
          reject(
            new RequestTimeoutException(
              'La báscula no respondió en los 5 segundos esperados',
            ),
          ),
        );
      }, DEFAULT_TIMEOUT_MS);

      parser.on('data', (line: string) => {
        const value = parseFloat(String(line).trim());
        if (Number.isNaN(value)) return; // línea no numérica: seguir esperando
        finish(() => resolve({ weight: value }));
      });

      port.on('error', (err) => {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === 'EAGAIN' || code === 'EBUSY') {
          finish(() => reject(new ConflictException('El puerto serial está ocupado')));
        } else if (code === 'ENOENT') {
          finish(() =>
            reject(new ServiceUnavailableException('Puerto de la báscula no encontrado')),
          );
        } else {
          finish(() =>
            reject(
              new ServiceUnavailableException(`No se pudo abrir la báscula: ${err.message}`),
            ),
          );
        }
      });

      port.open(() => {}); // los errores llegan por el evento 'error'
    });
  }
}
