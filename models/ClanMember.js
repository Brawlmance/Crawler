const Sequelize = require('sequelize')
const sequelize = require(process.env.PWD + '/database')

const ClanMembers = sequelize.define('clan_member', {
  clan_id: Sequelize.INTEGER.UNSIGNED,
  brawlhalla_id: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true
  },
  personal_xp: Sequelize.INTEGER.UNSIGNED
}, {
  indexes: [
    {
      fields: ['clan_id']
    }
  ]
})

module.exports = ClanMembers
