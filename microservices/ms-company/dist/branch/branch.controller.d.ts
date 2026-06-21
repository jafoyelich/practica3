import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
export declare class BranchController {
    private readonly branchService;
    constructor(branchService: BranchService);
    getCompanies(): Promise<any[]>;
    createCompany(dto: CreateCompanyDto): Promise<{
        message: string;
        company: any;
    }>;
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
}
