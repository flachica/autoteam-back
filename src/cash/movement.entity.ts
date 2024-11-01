import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Court } from '../court/court.entity';
import { AutoMap } from '../decorators/automap';
import { Player } from '../player/player.entity';

@Entity()
@Index(['player', 'date'])
export class Movement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Player, (player) => player.movements)
  @AutoMap()
  @JoinTable()
  player: Player;

  @Column()
  @AutoMap()
  date: Date;

  @Column()
  @AutoMap()
  name: string;

  @ManyToOne(() => Court, (court) => court.movements)
  @AutoMap()
  @JoinTable()
  court: Court;

  @Column('decimal', { precision: 10, scale: 2 })
  @AutoMap()
  amount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  @AutoMap()
  amount_abs: number;

  @Column()
  @AutoMap()
  type: 'in' | 'out';

  @Column({ nullable: false, default: false })
  @AutoMap()
  validated: boolean;

  setDefaults() {
    this.type = this.amount > 0 ? 'in' : 'out';
    if (!this.date) {
      this.date = new Date();
    }
    this.amount_abs = Math.abs(this.amount);
  }
}
