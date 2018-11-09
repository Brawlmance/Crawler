const Sequelize = require('sequelize')
const sequelize = require(process.env.PWD + '/database')

const Player = sequelize.define('player', {
  brawlhalla_id: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true
  },
  name: Sequelize.STRING,
  xp: Sequelize.INTEGER.UNSIGNED,
  level: Sequelize.INTEGER.UNSIGNED,
  rank: Sequelize.INTEGER.UNSIGNED,
  tier: Sequelize.STRING,
  games: Sequelize.INTEGER.UNSIGNED,
  wins: Sequelize.INTEGER.UNSIGNED,
  rating: Sequelize.INTEGER.UNSIGNED,
  region: Sequelize.STRING,
  legend1: Sequelize.INTEGER.UNSIGNED,
  legend2: Sequelize.INTEGER.UNSIGNED,
  legend3: Sequelize.INTEGER.UNSIGNED,
  lastupdated: Sequelize.INTEGER.UNSIGNED
}, {
  indexes: [
    {
      fields: ['rank']
    }
  ]
})

module.exports = Player
