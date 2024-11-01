import { Player } from "src/player/player.entity";
import { Column, Entity, Index, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Court } from "./court.entity";

@Entity()
@Index(['court'], )
export class InvitedPlayer {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Court, (court) => court.invitedPlayers, { onDelete: 'CASCADE' })
    court: Court;

    @ManyToOne(() => Player, {
        cascade: true,
        onDelete: 'CASCADE',
        nullable: true,
    })
    payerPlayer: Player

    @ManyToOne(() => Player, {
        cascade: true,
        onDelete: 'CASCADE',
        nullable: true,
    })
    invitedPlayer: Player;

}