import { Controller, Get, Post, Put, Body, Param, UseGuards, ValidationPipe, ParseUUIDPipe } from '@nestjs/common';
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Get('companies')
  async getCompanies() {
    return await this.branchService.getCompanies();
  }

  @Post('companies')
  async createCompany(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: CreateCompanyDto,
  ) {
    return await this.branchService.createCompany(dto);
  }

  @Get('cities')
  async getCities() {
    return await this.branchService.getCities();
  }

  @Get('branches')
  async getBranches() {
    return await this.branchService.getBranches();
  }

  @Post('branches')
  async createBranch(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: CreateBranchDto,
  ) {
    return await this.branchService.createBranch(dto);
  }

  @Put('branches/:id')
  async updateBranch(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: UpdateBranchDto,
  ) {
    return await this.branchService.updateBranch(id, dto);
  }
}
