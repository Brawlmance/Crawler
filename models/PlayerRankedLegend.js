const Sequelize = require('sequelize')
const sequelize = require(process.env.PWD + '/database')

const PlayerRankedLegend = sequelize.define('player_ranked_legend', {
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
  rating: Sequelize.SMALLINT.UNSIGNED,
  peak_rating: Sequelize.SMALLINT.UNSIGNED,
  tier: Sequelize.STRING,
  wins: Sequelize.SMALLINT.UNSIGNED,
  games: Sequelize.MEDIUMINT.UNSIGNED
}, {
  indexes: [
    {
      unique: true,
      fields: ['brawlhalla_id', 'legend_id']
    },
    {
      fields: ['day', 'legend_id']
    },
    {
      fields: ['legend_id', 'rating']
    }
  ]
})

module.exports = PlayerRankedLegend
