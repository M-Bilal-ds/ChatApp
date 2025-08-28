import { AuthService } from './auth.service';
import { SignupDto, LoginDto, AuthResponseDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signup(signupDto: SignupDto): Promise<AuthResponseDto>;
    login(req: any, loginDto: LoginDto): Promise<AuthResponseDto>;
    getProfile(req: any): Promise<{
        user: any;
    }>;
    logout(): Promise<{
        message: string;
    }>;
}
