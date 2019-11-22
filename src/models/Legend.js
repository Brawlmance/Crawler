const Sequelize = require('sequelize')
const sequelize = require('../database')

const Legends = sequelize.define(
  'legend',
  {
    legend_id: {
      primaryKey: true,
      type: Sequelize.INTEGER.UNSIGNED,
    },
    legend_name_key: Sequelize.STRING,
    bio_name: Sequelize.STRING,
    weapon_one: Sequelize.STRING,
    weapon_two: Sequelize.STRING,
    strength: Sequelize.TINYINT.UNSIGNED,
    dexterity: Sequelize.TINYINT.UNSIGNED,
    defense: Sequelize.TINYINT.UNSIGNED,
    speed: Sequelize.TINYINT.UNSIGNED,
  },
  {
    indexes: [
      {
        fields: ['legend_name_key'],
      },
    ],
  }
)

module.exports = Legends
