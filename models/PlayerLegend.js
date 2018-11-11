const Sequelize = require('sequelize')
const sequelize = require(process.env.PWD + '/database')

const PlayerLegend = sequelize.define('player_legend', {
  brawlhalla_id: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true
  },
  legend_id: {
    type: Sequelize.TINYINT.UNSIGNED,
    primaryKey: true
  },
  day: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true
  },
  damagedealt: Sequelize.BIGINT.UNSIGNED,
  damagetaken: Sequelize.BIGINT.UNSIGNED,
  kos: Sequelize.INTEGER.UNSIGNED,
  falls: Sequelize.INTEGER.UNSIGNED,
  suicides: Sequelize.INTEGER.UNSIGNED,
  teamkos: Sequelize.INTEGER.UNSIGNED,
  matchtime: Sequelize.BIGINT.UNSIGNED,
  games: Sequelize.INTEGER.UNSIGNED,
  wins: Sequelize.INTEGER.UNSIGNED,
  damageunarmed: Sequelize.BIGINT.UNSIGNED,
  damagethrownitem: Sequelize.BIGINT.UNSIGNED,
  damageweaponone: Sequelize.BIGINT.UNSIGNED,
  damageweapontwo: Sequelize.BIGINT.UNSIGNED,
  damagegadgets: Sequelize.BIGINT.UNSIGNED,
  kounarmed: Sequelize.INTEGER.UNSIGNED,
  kothrownitem: Sequelize.INTEGER.UNSIGNED,
  koweaponone: Sequelize.INTEGER.UNSIGNED,
  koweapontwo: Sequelize.INTEGER.UNSIGNED,
  kogadgets: Sequelize.INTEGER.UNSIGNED,
  timeheldweaponone: Sequelize.BIGINT.UNSIGNED,
  timeheldweapontwo: Sequelize.BIGINT.UNSIGNED,
  xp: Sequelize.INTEGER.UNSIGNED,
  level: Sequelize.SMALLINT.UNSIGNED
}, {
  indexes: [
    {
      fields: ['day', 'legend_id']
    },
    {
      fields: ['legend_id', 'xp']
    }
  ]
})

module.exports = PlayerLegend
