import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private readonly transporter;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const host = configService.get<string>('SMTP_HOST');
    const port = Number(configService.get<string>('SMTP_PORT') ?? '0');
    const user = configService.get<string>('SMTP_USER');
    const password = configService.get<string>('SMTP_PASSWORD');
    const from = configService.get<string>('SMTP_FROM');

    if (!host || !port || !user || !password || !from) {
      throw new Error('Missing SMTP configuration (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD/SMTP_FROM)');
    }

    this.from = from;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: password },
    });
  }

  async sendConfirmation(params: {
    cliente_nombre: string;
    cliente_email: string;
    id_venta: string;
    nro_comprobante: number;
    fecha: string;
    total: number;
    detalle: Array<{
      descripcion?: string;
      id_producto: string;
      cantidad: number;
      precio_unitario: number;
      subtotal: number;
    }>;
  }): Promise<void> {
    const subject = 'Confirmación de compra';

    const detailRows = params.detalle
      .map(
        (d) => `
<tr>
  <td>${d.descripcion ?? d.id_producto}</td>
  <td style="text-align:center;">${d.cantidad}</td>
  <td style="text-align:center;">${d.precio_unitario}</td>
  <td style="text-align:center;">${d.subtotal}</td>
</tr>`
      )
      .join('');

    const html = `
      <div>
        <p>Hola ${params.cliente_nombre}</p>
        <p>Su compra fue registrada correctamente.</p>

        <p><b>Número de venta:</b> ${params.id_venta}</p>
        <p><b>Comprobante:</b> ${params.nro_comprobante}</p>
        <p><b>Fecha:</b> ${params.fecha}</p>
        <p><b>Total:</b> ${params.total}</p>

        <h3>Detalle de productos</h3>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse; width:100%;">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio unitario</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${detailRows}
          </tbody>
        </table>

        <p>Gracias por su compra.</p>
      </div>
    `;

    // Simulación de fallas opcional
    const shouldFail = this.configService.get<string>('EMAIL_SHOULD_FAIL') === 'true';
    if (shouldFail) {
      throw new Error('EmailService simulated failure');
    }

    await this.transporter.sendMail({
      from: this.from,
      to: params.cliente_email,
      subject,
      html,
    });

    this.logger.log(`Email sent to=${params.cliente_email}`);
  }
}

