import { MovementResponseDto } from "src/cash/dtos/movement.response.dto";
import { ClubResponseDto } from "src/club/dtos/club.response.dto";

export class PlayerResponseDto {
    id: number;
    name: string;
    surname?: string;
    phone: string;
    email: string;
    role: string;
    clubIds: number[];
    password: string;
    draftMovements: MovementResponseDto[];
    balance: number;
    futureBalance: number;
  }
  