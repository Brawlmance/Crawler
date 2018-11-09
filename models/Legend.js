const Sequelize = require('sequelize')
const sequelize = require(process.env.PWD + '/database')

const Legends = sequelize.define('legend', {
  legend_id: {
    primaryKey: true,
    type: Sequelize.INTEGER.UNSIGNED
  },
  legend_name: Sequelize.STRING,
  bio_name: Sequelize.STRING,
  weapon_one: Sequelize.STRING,
  weapon_two: Sequelize.STRING,
  strength: Sequelize.TINYINT.UNSIGNED,
  dexterity: Sequelize.TINYINT.UNSIGNED,
  defense: Sequelize.TINYINT.UNSIGNED,
  speed: Sequelize.TINYINT.UNSIGNED
}, {
  indexes: [
    {
      fields: ['legend_name']
    }
  ]
})

module.exports = Legends
