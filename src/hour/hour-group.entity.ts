import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AutoMap } from '../decorators/automap';
import { Hour } from './hour.entity';

@Entity()
export class HourGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @AutoMap()
  name: string;

  @Column()
  @AutoMap()
  active: boolean;

  @AutoMap()
  @OneToMany(() => Hour, (hour) => hour.groupId)
  hours: Hour[];
}
