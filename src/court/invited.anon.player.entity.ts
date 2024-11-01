import { Player } from "src/player/player.entity";
import { Column, Entity, Index, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Court } from "./court.entity";

@Entity()
@Index(['court'], )
export class InvitedAnonPlayer {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Court, (court) => court.anonPlayers, { onDelete: 'CASCADE' })
    court: Court;

    @ManyToOne(() => Player, {
        cascade: true,
        onDelete: 'CASCADE',
        nullable: true,
    })
    payerPlayer: Player

    @Column({ nullable: true })
    nameAnonPlayer?: string;

}