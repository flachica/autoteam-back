Select *
from
(
Select d.id, d.fullname, round(max(d.balance), 2) balance, round(sum(coalesce(d.price, 0)), 2) calculated_balance, count(d.courtId) court_count
from
(
    SELECT p.id, p.name || coalesce(' ' || p.surname,'') fullname, p.balance, c.id courtId, -1*c.price price, c.date, "OWN" court_type, c.state
    FROM player p 
    left join court_players_player cpp on p.id=cpp.playerId
    left join court c on cpp.courtId=c.id
    where coalesce(c.state,'') in ('reserved', 'expired', '')
    union all
    SELECT p.id, p.name || coalesce(' ' || p.surname,'') fullname, p.balance, c.id courtId, -1*c.price price, c.date, "KNOWN" court_type, c.state
    FROM player p 
    inner join invited_player ip on p.id=ip.payerPlayerId
    left join court c on ip.courtId=c.id
    where coalesce(c.state,'') in ('reserved', 'expired', '')
    union all
    SELECT p.id, p.name || coalesce(' ' || p.surname,'') fullname, p.balance, c.id courtId, -1*c.price price, c.date, "UNKNOWN" court_type, c.state
    FROM player p 
    inner join invited_anon_player iap on p.id=iap.payerPlayerId
    left join court c on iap.courtId=c.id
    where coalesce(c.state,'') in ('reserved', 'expired', '')
    union all
    Select p.id, p.name || coalesce(' ' || p.surname,'') fullname, p.balance, null courtId, m.amount price, m.date, 'MOVEMENT' court_type, null state
    from movement m
    inner join player p on m.playerId=p.id
    where (m.type = 'in' or m.courtId is null ) and m.validated=1
) d
group by d.id, d.fullname
) h
where h.balance!=h.calculated_balance