import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Movement } from '../cash/movement.entity';
import { Club } from '../club/club.entity';
import { AutoMap } from '../decorators/automap';
import { Player } from '../player/player.entity';
import { Reservation } from '../reservation/reservation.entity';
import { Transform } from 'class-transformer';
import { InvitedPlayer } from './invited.player.entity';
import { InvitedAnonPlayer } from './invited.anon.player.entity';

@Entity()
@Index(['name', 'date', 'hour'], { unique: true })
export class Court {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @AutoMap()
  name?: string;

  @Column()
  @AutoMap()
  date: Date;

  @Column()
  @AutoMap()
  hour: string;

  @Column()
  @AutoMap()
  minPlayers: number;

  @Column()
  @AutoMap()
  maxPlayers: number;

  @Column('decimal', { precision: 10, scale: 2 })
  @AutoMap()
  price: number;

  @ManyToMany(() => Player, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinTable()
  @AutoMap()
  players: Player[];

  @OneToMany(() => InvitedPlayer, (invitedPlayer) => invitedPlayer.court)
  invitedPlayers: InvitedPlayer[];

  @OneToMany(() => InvitedAnonPlayer, (invitedAnonPlayer) => invitedAnonPlayer.court)
  anonPlayers: InvitedAnonPlayer[];

  @ManyToOne(() => Club, (club) => club.courts)
  @AutoMap()
  club: Club;

  @Column()
  @AutoMap()
  state: string;

  @ManyToOne(() => Reservation, (reservation) => reservation.court)
  reservation: Reservation | null;

  @OneToMany(() => Movement, (movement) => movement.court)
  @AutoMap()
  movements: Movement[];
}
