const Sequelize = require('sequelize')
const sequelize = require(process.env.PWD + '/database')

const Clans = sequelize.define('clan', {
  clan_id: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true
  },
  clan_name: Sequelize.STRING,
  clan_xp: Sequelize.INTEGER.UNSIGNED
}, {
  indexes: [
  ]
})

module.exports = Clans
