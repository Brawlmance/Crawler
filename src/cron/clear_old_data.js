const Player = require('../models/Player')
const PlayerLegend = require('../models/PlayerLegend')
const PlayerRankedLegend = require('../models/PlayerRankedLegend')
const Sequelize = require('sequelize')
const Op = Sequelize.Op

module.exports = async () => {
  const day = Math.floor(Date.now() / 1000 / 60 / 60 / 24)

  Player.destroy({
    where: {
      lastupdated: {
        [Op.lt]: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 7,
      },
    },
  })

  PlayerLegend.destroy({
    where: {
      day: {
        [Op.lte]: day - 3,
      },
    },
  })

  PlayerRankedLegend.destroy({
    where: {
      day: {
        [Op.lte]: day - 3,
      },
    },
  })
}
