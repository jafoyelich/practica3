import { ConfigService } from '@nestjs/config';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
export declare class BranchService {
    private readonly configService;
    private readonly supabaseClient;
    private readonly logger;
    constructor(configService: ConfigService);
    getCompanies(): Promise<any[]>;
    getCities(): Promise<any[]>;
    getBranches(): Promise<any[]>;
    createBranch(dto: CreateBranchDto): Promise<{
        message: string;
        branch: any;
    }>;
    updateBranch(id: string, dto: UpdateBranchDto): Promise<{
        message: string;
        branch: any;
    }>;
    createCompany(dto: {
        nombre: string;
    }): Promise<{
        message: string;
        company: any;
    }>;
}
