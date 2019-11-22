const Sequelize = require('sequelize')
const sequelize = require('../database')

const RankingProgress = sequelize.define(
  'ranking_progress',
  {
    type: {
      type: Sequelize.STRING(50),
      primaryKey: true,
    },
    first_page_crawl_ts: {
      type: Sequelize.INTEGER.UNSIGNED,
    },
    page: {
      type: Sequelize.INTEGER.UNSIGNED,
    },
  },
  {
    indexes: [],
  }
)

module.exports = RankingProgress
