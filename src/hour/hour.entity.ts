import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AutoMap } from '../decorators/automap';
import { HourGroup } from './hour-group.entity';

@Entity()
@Index(['groupId', 'day_name', 'name'], { unique: true })
export class Hour {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @AutoMap()
  name: string;

  @Column()
  @AutoMap()
  index: number;

  @Column()
  @AutoMap()
  day_name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  @AutoMap()
  price: number;

  @Column()
  @JoinTable()
  @AutoMap()
  @ManyToOne(() => HourGroup, (hourGroup) => hourGroup.id)
  groupId: number;

  @Column()
  @AutoMap()
  active: boolean;
}
