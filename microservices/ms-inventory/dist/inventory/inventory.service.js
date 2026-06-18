"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var InventoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
const XLSX = __importStar(require("xlsx"));
let InventoryService = InventoryService_1 = class InventoryService {
    configService;
    supabaseClient;
    logger = new common_1.Logger(InventoryService_1.name);
    constructor(configService) {
        this.configService = configService;
        const supabaseUrl = this.configService.get('SUPABASE_URL');
        const supabaseKey = this.configService.get('SUPABASE_KEY');
        if (!supabaseUrl || !supabaseKey) {
            this.logger.warn('SUPABASE_URL o SUPABASE_KEY no están definidas en las variables de entorno.');
        }
        this.supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder-key', {
            db: {
                schema: 'inventory_db',
            },
        });
    }
    async loadExcel(fileBuffer) {
        this.logger.log('Iniciando carga de inventario desde archivo Excel...');
        try {
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet);
            this.logger.log(`Leídas ${rows.length} filas del archivo Excel.`);
            const results = [];
            for (const row of rows) {
                if (!row.id_sucursal || !row.id_producto || row.cantidad === undefined) {
                    throw new common_1.BadRequestException('Formato de Excel inválido. Debe contener: id_sucursal, id_producto, cantidad.');
                }
                const cantidad = Number(row.cantidad);
                if (isNaN(cantidad) || cantidad <= 0) {
                    throw new common_1.BadRequestException(`Cantidad inválida (${row.cantidad}) para producto ${row.id_producto} en sucursal ${row.id_sucursal}.`);
                }
                const { data: currentStock, error: getError } = await this.supabaseClient
                    .from('stock_sucursal')
                    .select('*')
                    .eq('id_sucursal', row.id_sucursal)
                    .eq('id_producto', row.id_producto)
                    .maybeSingle();
                if (getError) {
                    throw new common_1.InternalServerErrorException(`Error al consultar stock actual: ${getError.message}`);
                }
                let nuevoSaldo = cantidad;
                let updateResult;
                if (currentStock) {
                    nuevoSaldo = Number(currentStock.cantidad) + cantidad;
                    const { data, error: updateError } = await this.supabaseClient
                        .from('stock_sucursal')
                        .update({ cantidad: nuevoSaldo })
                        .eq('id_stock', currentStock.id_stock)
                        .select()
                        .single();
                    if (updateError) {
                        throw new common_1.InternalServerErrorException(`Error al actualizar stock: ${updateError.message}`);
                    }
                    updateResult = data;
                }
                else {
                    const { data, error: insertError } = await this.supabaseClient
                        .from('stock_sucursal')
                        .insert({
                        id_sucursal: row.id_sucursal,
                        id_producto: row.id_producto,
                        cantidad: nuevoSaldo,
                    })
                        .select()
                        .single();
                    if (insertError) {
                        throw new common_1.InternalServerErrorException(`Error al insertar stock: ${insertError.message}`);
                    }
                    updateResult = data;
                }
                const { error: kardexError } = await this.supabaseClient
                    .from('kardex')
                    .insert({
                    id_sucursal: row.id_sucursal,
                    id_producto: row.id_producto,
                    tipo_movimiento: 'INGRESO',
                    cantidad: cantidad,
                    saldo_resultante: nuevoSaldo,
                    referencia: 'Carga inicial por archivo Excel',
                });
                if (kardexError) {
                    this.logger.error(`Error al registrar Kardex para carga Excel: ${kardexError.message}`);
                }
                results.push(updateResult);
            }
            return {
                message: 'Carga de inventario finalizada con éxito.',
                filas_procesadas: rows.length,
                data: results,
            };
        }
        catch (error) {
            this.logger.error(`Fallo al procesar Excel de inventario: ${error.message}`);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(`Error al leer archivo Excel: ${error.message}`);
        }
    }
    async getProductStock(id_producto, id_sucursal) {
        this.logger.log(`Consultando stock para producto ${id_producto} en sucursal ${id_sucursal}...`);
        const { data, error } = await this.supabaseClient
            .from('stock_sucursal')
            .select('cantidad')
            .eq('id_producto', id_producto)
            .eq('id_sucursal', id_sucursal)
            .maybeSingle();
        if (error) {
            this.logger.error(`Error al consultar stock: ${error.message}`);
            throw new common_1.InternalServerErrorException(`Error al obtener stock: ${error.message}`);
        }
        return data ? Number(data.cantidad) : 0;
    }
    async registerLoss(dto) {
        this.logger.log(`Registrando merma para producto ${dto.id_producto} en sucursal ${dto.id_sucursal}...`);
        const { data: currentStock, error: getError } = await this.supabaseClient
            .from('stock_sucursal')
            .select('*')
            .eq('id_sucursal', dto.id_sucursal)
            .eq('id_producto', dto.id_producto)
            .maybeSingle();
        if (getError) {
            throw new common_1.InternalServerErrorException(`Error al consultar stock: ${getError.message}`);
        }
        const stockActual = currentStock ? Number(currentStock.cantidad) : 0;
        if (stockActual < dto.cantidad) {
            throw new common_1.BadRequestException(`Stock insuficiente para registrar merma. Disponible: ${stockActual}, Solicitado: ${dto.cantidad}`);
        }
        const nuevoSaldo = stockActual - dto.cantidad;
        const { error: updateError } = await this.supabaseClient
            .from('stock_sucursal')
            .update({ cantidad: nuevoSaldo })
            .eq('id_stock', currentStock.id_stock);
        if (updateError) {
            throw new common_1.InternalServerErrorException(`Error al actualizar stock: ${updateError.message}`);
        }
        const { data: kardexDB, error: kardexError } = await this.supabaseClient
            .from('kardex')
            .insert({
            id_sucursal: dto.id_sucursal,
            id_producto: dto.id_producto,
            tipo_movimiento: 'EGRESO',
            cantidad: dto.cantidad,
            saldo_resultante: nuevoSaldo,
            referencia: `Merma: ${dto.motivo}`,
        })
            .select()
            .single();
        if (kardexError) {
            this.logger.error(`Error al registrar Kardex para merma: ${kardexError.message}`);
        }
        return {
            message: 'Merma registrada con éxito.',
            id_producto: dto.id_producto,
            id_sucursal: dto.id_sucursal,
            saldo_restante: nuevoSaldo,
            kardex: kardexDB,
        };
    }
    async transferStock(dto) {
        this.logger.log(`Iniciando transferencia de ${dto.cantidad} unidades del producto ${dto.id_producto} desde ${dto.id_sucursal_origen} hacia ${dto.id_sucursal_destino}`);
        if (dto.id_sucursal_origen === dto.id_sucursal_destino) {
            throw new common_1.BadRequestException('La sucursal de origen y destino no pueden ser iguales.');
        }
        const { data: stockOrigen, error: errorOrigen } = await this.supabaseClient
            .from('stock_sucursal')
            .select('*')
            .eq('id_sucursal', dto.id_sucursal_origen)
            .eq('id_producto', dto.id_producto)
            .maybeSingle();
        if (errorOrigen) {
            throw new common_1.InternalServerErrorException(`Error al obtener stock de origen: ${errorOrigen.message}`);
        }
        const cantOrigen = stockOrigen ? Number(stockOrigen.cantidad) : 0;
        if (cantOrigen < dto.cantidad) {
            throw new common_1.BadRequestException(`Stock insuficiente en origen. Disponible: ${cantOrigen}, Requerido: ${dto.cantidad}`);
        }
        const { data: stockDestino, error: errorDestino } = await this.supabaseClient
            .from('stock_sucursal')
            .select('*')
            .eq('id_sucursal', dto.id_sucursal_destino)
            .eq('id_producto', dto.id_producto)
            .maybeSingle();
        if (errorDestino) {
            throw new common_1.InternalServerErrorException(`Error al obtener stock de destino: ${errorDestino.message}`);
        }
        const nuevoSaldoOrigen = cantOrigen - dto.cantidad;
        const cantDestino = stockDestino ? Number(stockDestino.cantidad) : 0;
        const nuevoSaldoDestino = cantDestino + dto.cantidad;
        const { error: updateOrigenError } = await this.supabaseClient
            .from('stock_sucursal')
            .update({ cantidad: nuevoSaldoOrigen })
            .eq('id_stock', stockOrigen.id_stock);
        if (updateOrigenError) {
            throw new common_1.InternalServerErrorException(`Error al actualizar stock de origen: ${updateOrigenError.message}`);
        }
        if (stockDestino) {
            const { error: updateDestError } = await this.supabaseClient
                .from('stock_sucursal')
                .update({ cantidad: nuevoSaldoDestino })
                .eq('id_stock', stockDestino.id_stock);
            if (updateDestError) {
                await this.supabaseClient.from('stock_sucursal').update({ cantidad: cantOrigen }).eq('id_stock', stockOrigen.id_stock);
                throw new common_1.InternalServerErrorException(`Error al actualizar stock de destino: ${updateDestError.message}`);
            }
        }
        else {
            const { error: insertDestError } = await this.supabaseClient
                .from('stock_sucursal')
                .insert({
                id_sucursal: dto.id_sucursal_destino,
                id_producto: dto.id_producto,
                cantidad: nuevoSaldoDestino,
            });
            if (insertDestError) {
                await this.supabaseClient.from('stock_sucursal').update({ cantidad: cantOrigen }).eq('id_stock', stockOrigen.id_stock);
                throw new common_1.InternalServerErrorException(`Error al insertar stock de destino: ${insertDestError.message}`);
            }
        }
        const { error: kardexOrigenErr } = await this.supabaseClient
            .from('kardex')
            .insert({
            id_sucursal: dto.id_sucursal_origen,
            id_producto: dto.id_producto,
            tipo_movimiento: 'TRANSFERENCIA',
            cantidad: dto.cantidad,
            saldo_resultante: nuevoSaldoOrigen,
            referencia: `Transferencia egreso hacia sucursal ${dto.id_sucursal_destino}`,
        });
        if (kardexOrigenErr) {
            this.logger.error(`Error al registrar Kardex origen: ${kardexOrigenErr.message}`);
        }
        const { error: kardexDestErr } = await this.supabaseClient
            .from('kardex')
            .insert({
            id_sucursal: dto.id_sucursal_destino,
            id_producto: dto.id_producto,
            tipo_movimiento: 'TRANSFERENCIA',
            cantidad: dto.cantidad,
            saldo_resultante: nuevoSaldoDestino,
            referencia: `Transferencia ingreso desde sucursal ${dto.id_sucursal_origen}`,
        });
        if (kardexDestErr) {
            this.logger.error(`Error al registrar Kardex destino: ${kardexDestErr.message}`);
        }
        return {
            message: 'Transferencia realizada con éxito.',
            id_producto: dto.id_producto,
            sucursal_origen: { id: dto.id_sucursal_origen, saldo: nuevoSaldoOrigen },
            sucursal_destino: { id: dto.id_sucursal_destino, saldo: nuevoSaldoDestino },
        };
    }
    async getKardexHistory(id_sucursal) {
        this.logger.log(`Consultando Kardex para la sucursal: ${id_sucursal}`);
        const { data, error } = await this.supabaseClient
            .from('kardex')
            .select('*')
            .eq('id_sucursal', id_sucursal)
            .order('fecha', { ascending: false });
        if (error) {
            throw new common_1.InternalServerErrorException(`Error al obtener historial del Kardex: ${error.message}`);
        }
        return data;
    }
    async handleSaleCompletedEvent(payload) {
        const { id_venta, id_sucursal, detalles } = payload;
        if (!id_sucursal || !detalles || !Array.isArray(detalles)) {
            this.logger.warn(`Evento SaleCompleted recibido con payload inválido en ms-inventory: ${JSON.stringify(payload)}`);
            return;
        }
        this.logger.log(`Procesando baja de stock por venta completada. Venta ID: ${id_venta}, Sucursal ID: ${id_sucursal}`);
        for (const detail of detalles) {
            const { id_producto, cantidad } = detail;
            try {
                const { data: stockRow, error: getError } = await this.supabaseClient
                    .from('stock_sucursal')
                    .select('*')
                    .eq('id_sucursal', id_sucursal)
                    .eq('id_producto', id_producto)
                    .maybeSingle();
                if (getError) {
                    this.logger.error(`Error al consultar stock de producto ${id_producto} en venta ${id_venta}: ${getError.message}`);
                    continue;
                }
                const stockActual = stockRow ? Number(stockRow.cantidad) : 0;
                const nuevoSaldo = stockActual - Number(cantidad);
                if (stockRow) {
                    const { error: updateError } = await this.supabaseClient
                        .from('stock_sucursal')
                        .update({ cantidad: nuevoSaldo })
                        .eq('id_stock', stockRow.id_stock);
                    if (updateError) {
                        this.logger.error(`Error al restar stock para producto ${id_producto}: ${updateError.message}`);
                        continue;
                    }
                }
                else {
                    const { error: insertError } = await this.supabaseClient
                        .from('stock_sucursal')
                        .insert({
                        id_sucursal,
                        id_producto,
                        cantidad: nuevoSaldo,
                    });
                    if (insertError) {
                        this.logger.error(`Error al insertar stock inicial negativo para producto ${id_producto}: ${insertError.message}`);
                        continue;
                    }
                }
                const { error: kardexError } = await this.supabaseClient
                    .from('kardex')
                    .insert({
                    id_sucursal,
                    id_producto,
                    tipo_movimiento: 'VENTA',
                    cantidad: Number(cantidad),
                    saldo_resultante: nuevoSaldo,
                    referencia: `Egreso automático por venta completada ID: ${id_venta}`,
                });
                if (kardexError) {
                    this.logger.error(`Error al guardar Kardex de venta ${id_venta}: ${kardexError.message}`);
                }
                this.logger.log(`Descontado stock con éxito: Producto ${id_producto}, Cantidad: ${cantidad}, Saldo restante: ${nuevoSaldo}`);
            }
            catch (error) {
                this.logger.error(`Fallo al descontar stock por venta para producto ${id_producto}: ${error.message}`);
            }
        }
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = InventoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map