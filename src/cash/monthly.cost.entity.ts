import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AutoMap } from '../decorators/automap';
import { Movement } from './movement.entity';

@Entity()
export class MonthlyCost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('integer')
  @AutoMap()
  month: number;

  @Column('integer')
  @AutoMap()
  year: number;

  @Column('decimal', { precision: 10, scale: 2 })
  @AutoMap()
  amount: number;

  @OneToMany(() => Movement, (movement) => movement.monthlyCost)
  @AutoMap()
  movements: Movement[];

  @Column({ nullable: true })
  @AutoMap()
  description: string;
}
