import { IsEmail } from "class-validator";

export class PasswordLessDto {
    @IsEmail()
    destination: string;
}