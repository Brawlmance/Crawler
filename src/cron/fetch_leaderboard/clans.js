const Clan = require('../../models/Clan')
const ClanMember = require('../../models/ClanMember')

async function updatePlayerClan(brawlhallaId, clan) {
  if (!clan) return false

  const clanFromDB = await Clan.findOne({ where: { clan_id: clan.clan_id } })
  if (clanFromDB) {
    clanFromDB.update(clan)
  } else {
    Clan.create(clan)
  }

  const memberData = {
    clan_id: clan.clan_id,
    brawlhalla_id: brawlhallaId,
    personal_xp: clan.personal_xp,
  }
  const member = await ClanMember.findOne({ where: { brawlhalla_id: brawlhallaId } })
  if (member) {
    await member.update(memberData)
  } else {
    await ClanMember.create(memberData)
  }
}

module.exports = {
  updatePlayerClan,
}
