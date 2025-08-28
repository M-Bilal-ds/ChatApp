export declare class LoginDto {
    email: string;
    password: string;
}
export declare class SignupDto {
    email: string;
    username: string;
    password: string;
}
export declare class AuthResponseDto {
    access_token: string;
    user: {
        id: string;
        email: string;
        username: string;
    };
}
