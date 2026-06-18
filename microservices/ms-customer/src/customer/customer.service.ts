import { Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { AssignPointsDto } from './dto/assign-points.dto';

@Injectable()
export class CustomerService {
  private customers: any[] = [];
  private history: any[] = [];

  create(dto: CreateCustomerDto) {
    const customer = {
      id_cliente: Date.now().toString(),
      nombre: dto.nombre,
      nit_ci: dto.nit_ci,
      puntos_acumulados: 0,
    };

    this.customers.push(customer);

    return customer;
  }

  findAll() {
    return this.customers;
  }

  findOne(id: string) {
    return this.customers.find(
      customer => customer.id_cliente === id,
    );
  }

  getHistory(id: string) {
    return this.history.filter(
      item => item.id_cliente === id,
    );
  }

  assignPoints(
    id: string,
    dto: AssignPointsDto,
  ) {
    const customer = this.findOne(id);

    if (!customer) {
      return {
        message: 'Cliente no encontrado',
      };
    }

    customer.puntos_acumulados += dto.puntos;

    this.history.push({
      id_cliente: id,
      puntos_otorgados: dto.puntos,
      motivo: dto.motivo,
      fecha: new Date(),
    });

    return customer;
  }
}