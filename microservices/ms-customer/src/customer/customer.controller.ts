import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from '@nestjs/common';

import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { AssignPointsDto } from './dto/assign-points.dto';

@Controller('customers')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customerService.create(dto);
  }

  @Get()
  findAll() {
    return this.customerService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.customerService.findOne(id);
  }

  @Get(':id/history')
  getHistory(
    @Param('id') id: string,
  ) {
    return this.customerService.getHistory(id);
  }

  @Post(':id/points')
  assignPoints(
    @Param('id') id: string,
    @Body() dto: AssignPointsDto,
  ) {
    return this.customerService.assignPoints(
      id,
      dto,
    );
  }
}