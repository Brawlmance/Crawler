const Sequelize = require('sequelize')
const sequelize = require(process.env.PWD + '/database')

const Stat = sequelize.define('stat', {
  legend_id: {
    type: Sequelize.TINYINT.UNSIGNED,
    primaryKey: true
  },
  day: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true
  },
  tier: {
    type: Sequelize.STRING(50),
    primaryKey: true
  },
  damagedealt: Sequelize.BIGINT.UNSIGNED,
  damagetaken: Sequelize.BIGINT.UNSIGNED,
  kos: Sequelize.BIGINT.UNSIGNED,
  falls: Sequelize.BIGINT.UNSIGNED,
  suicides: Sequelize.BIGINT.UNSIGNED,
  teamkos: Sequelize.BIGINT.UNSIGNED,
  matchtime: Sequelize.BIGINT.UNSIGNED,
  games: Sequelize.BIGINT.UNSIGNED,
  wins: Sequelize.BIGINT.UNSIGNED,
  damageunarmed: Sequelize.BIGINT.UNSIGNED,
  damagethrownitem: Sequelize.BIGINT.UNSIGNED,
  damageweaponone: Sequelize.BIGINT.UNSIGNED,
  damageweapontwo: Sequelize.BIGINT.UNSIGNED,
  damagegadgets: Sequelize.BIGINT.UNSIGNED,
  kounarmed: Sequelize.BIGINT.UNSIGNED,
  kothrownitem: Sequelize.BIGINT.UNSIGNED,
  koweaponone: Sequelize.BIGINT.UNSIGNED,
  koweapontwo: Sequelize.BIGINT.UNSIGNED,
  kogadgets: Sequelize.BIGINT.UNSIGNED,
  timeheldweaponone: Sequelize.BIGINT.UNSIGNED,
  timeheldweapontwo: Sequelize.BIGINT.UNSIGNED
}, {
  indexes: [
    {
      unique: true,
      fields: ['legend_id', 'day', 'tier']
    },
    {
      fields: ['day', 'legend_id']
    }
  ]
})

module.exports = Stat
