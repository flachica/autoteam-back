import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Court } from '../court/court.entity';
import { Player } from '../player/player.entity';

@Entity()
export class Club {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1, description: 'The unique identifier of the club' })
  id: number;

  @Column()
  @Index({ unique: true })
  @ApiProperty({ example: 'Central Club', description: 'The name of the club' })
  name: string;

  @ManyToMany(() => Player, (player) => player.clubs)
  players: Player[];

  @ManyToMany(() => Court, (court) => court.club)
  courts: Court[];
}
