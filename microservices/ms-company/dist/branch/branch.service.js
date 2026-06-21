"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BranchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
let BranchService = BranchService_1 = class BranchService {
    configService;
    supabaseClient;
    logger = new common_1.Logger(BranchService_1.name);
    constructor(configService) {
        this.configService = configService;
        const supabaseUrl = this.configService.get('SUPABASE_URL') ||
            'https://placeholder.supabase.co';
        const supabaseKey = this.configService.get('SUPABASE_KEY') || 'placeholder-key';
        if (!this.configService.get('SUPABASE_URL') ||
            !this.configService.get('SUPABASE_KEY')) {
            this.logger.warn('SUPABASE_URL o SUPABASE_KEY no están definidas en las variables de entorno.');
        }
        this.supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            db: {
                schema: 'company_db',
            },
        });
        this.logger.log('SupabaseClient inicializado apuntando al esquema: company_db');
    }
    async getCompanies() {
        this.logger.log('Listando todas las compañías...');
        const { data, error } = await this.supabaseClient
            .from('companias')
            .select('*')
            .order('nombre', { ascending: true });
        if (error) {
            this.logger.error(`Error al listar compañías: ${error.message}`);
            throw new common_1.InternalServerErrorException(`Error al obtener compañías: ${error.message}`);
        }
        return data;
    }
    async getCities() {
        this.logger.log('Listando todas las ciudades...');
        const { data, error } = await this.supabaseClient
            .from('ciudades')
            .select('*')
            .order('nombre', { ascending: true });
        if (error) {
            this.logger.error(`Error al listar ciudades: ${error.message}`);
            throw new common_1.InternalServerErrorException(`Error al obtener ciudades: ${error.message}`);
        }
        return data;
    }
    async getBranches() {
        this.logger.log('Listando todas las sucursales...');
        const { data, error } = await this.supabaseClient
            .from('sucursales')
            .select('*')
            .order('nombre', { ascending: true });
        if (error) {
            this.logger.error(`Error al listar sucursales: ${error.message}`);
            throw new common_1.InternalServerErrorException(`Error al obtener sucursales: ${error.message}`);
        }
        return data;
    }
    async createBranch(dto) {
        this.logger.log(`Creando sucursal: ${dto.nombre}`);
        const { data, error } = await this.supabaseClient
            .from('sucursales')
            .insert({
            id_compania: dto.id_compania,
            id_ciudad: dto.id_ciudad,
            nombre: dto.nombre,
            direccion: dto.direccion,
        })
            .select()
            .single();
        if (error) {
            this.logger.error(`Error al crear sucursal: ${error.message}`);
            throw new common_1.BadRequestException(`No se pudo crear la sucursal: ${error.message}`);
        }
        return {
            message: 'Sucursal creada exitosamente.',
            branch: data,
        };
    }
    async updateBranch(id, dto) {
        this.logger.log(`Actualizando sucursal con ID: ${id}`);
        const { data: existing, error: findError } = await this.supabaseClient
            .from('sucursales')
            .select('id_sucursal')
            .eq('id_sucursal', id)
            .maybeSingle();
        if (findError) {
            throw new common_1.InternalServerErrorException(`Error al buscar sucursal: ${findError.message}`);
        }
        if (!existing) {
            throw new common_1.NotFoundException(`La sucursal con ID ${id} no existe.`);
        }
        const { data, error } = await this.supabaseClient
            .from('sucursales')
            .update({
            ...(dto.id_compania && { id_compania: dto.id_compania }),
            ...(dto.id_ciudad && { id_ciudad: dto.id_ciudad }),
            ...(dto.nombre && { nombre: dto.nombre }),
            ...(dto.direccion && { direccion: dto.direccion }),
        })
            .eq('id_sucursal', id)
            .select()
            .single();
        if (error) {
            this.logger.error(`Error al actualizar sucursal: ${error.message}`);
            throw new common_1.BadRequestException(`No se pudo actualizar la sucursal: ${error.message}`);
        }
        return {
            message: 'Sucursal actualizada exitosamente.',
            branch: data,
        };
    }
};
exports.BranchService = BranchService;
exports.BranchService = BranchService = BranchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], BranchService);
//# sourceMappingURL=branch.service.js.map