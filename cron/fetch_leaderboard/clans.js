const Clan = require(process.env.PWD + '/models/Clan')
const ClanMember = require(process.env.PWD + '/models/ClanMember')

async function updatePlayerClan (player) {
  const clan = player.clan
  if (!clan) return false

  const clanFromDB = await Clan.findOne({ where: { clan_id: clan.clan_id } })
  if (clanFromDB) {
    clanFromDB.update(clan)
  } else {
    Clan.create(clan)
  }

  const memberData = {
    clan_id: clan.clan_id,
    brawlhalla_id: player.brawlhalla_id,
    personal_xp: clan.personal_xp
  }
  const member = await ClanMember.findOne({ where: { brawlhalla_id: player.brawlhalla_id } })
  if (member) {
    await member.update(memberData)
  } else {
    await ClanMember.create(memberData)
  }
}

module.exports = {
  updatePlayerClan
}
