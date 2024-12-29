Select d.id, d.fullname, round(d.balance, 2) balance, round(coalesce(d.price, 0), 2) amount, courtId, courtDate, courtState
from
(
    SELECT p.id, p.name || coalesce(' ' || p.surname,'') fullname, p.balance, c.id courtId, c.date courtDate, c.state courtState, -1*c.price price, c.date, "OWN" court_type, c.state
    FROM player p 
    left join court_players_player cpp on p.id=cpp.playerId
    left join court c on cpp.courtId=c.id
    where c.reservationId is not null and coalesce(c.state,'') in ('reserved', 'expired', '')
    union all
    SELECT p.id, p.name || coalesce(' ' || p.surname,'') fullname, p.balance, c.id courtId, c.date courtDate, c.state courtState, -1*c.price price, c.date, "KNOWN" court_type, c.state
    FROM player p 
    inner join invited_player ip on p.id=ip.payerPlayerId
    left join court c on ip.courtId=c.id
    where c.reservationId is not null and  coalesce(c.state,'') in ('reserved', 'expired', '')
    union all
    SELECT p.id, p.name || coalesce(' ' || p.surname,'') fullname, p.balance, c.id courtId, c.date courtDate, c.state courtState, -1*c.price price, c.date, "UNKNOWN" court_type, c.state
    FROM player p 
    inner join invited_anon_player iap on p.id=iap.payerPlayerId
    left join court c on iap.courtId=c.id
    where c.reservationId is not null and  coalesce(c.state,'') in ('reserved', 'expired', '')
    union all
    Select p.id, p.name || coalesce(' ' || p.surname,'') fullname, p.balance, null courtId, null courtDate, null courtState, m.amount price, m.date, 'MOVEMENT' court_type, null state
    from movement m
    inner join player p on m.playerId=p.id
    where (m.type = 'in' or m.courtId is null ) and m.validated=1
) d
where d.id=1
order by courtDate desc