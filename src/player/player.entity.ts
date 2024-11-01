import { IsOptional } from 'class-validator';
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Movement } from '../cash/movement.entity';
import { Club } from '../club/club.entity';
import { AutoMap } from '../decorators/automap';
import { Court } from 'src/court/court.entity';

@Entity()
@Index(['name', 'surname'], { unique: true })
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @AutoMap()
  name: string;

  @IsOptional()
  @Column({ nullable: true })
  @AutoMap()
  surname?: string;

  @Column({ nullable: true })
  @AutoMap()
  phone: string;

  @Column({ nullable: true })
  @AutoMap()
  email: string;

  @Column({ default: 'player' })
  @AutoMap()
  role: string;

  @ManyToMany(() => Club, (club) => club.players, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinTable()
  @AutoMap()
  clubs: Club[];

  @Column({ default: '' })
  @AutoMap()
  password: string;

  @OneToMany(() => Movement, (movement) => movement.player)
  @AutoMap()
  movements: Movement[];

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @AutoMap()
  balance: number;

  @OneToMany(() => Court, (court) => court.invitedPlayers)
  invitedCourts: Court[];
}
