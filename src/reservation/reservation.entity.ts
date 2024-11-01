import { Entity, JoinTable, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Court } from '../court/court.entity';
import { AutoMap } from '../decorators/automap';

@Entity()
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Court, (court) => court.reservation, {
    cascade: false,
    onDelete: 'SET NULL',
  })
  @AutoMap()
  @JoinTable()
  court: Court;
}
