const config = require('./config')
const Sequelize = require('sequelize')

const sequelize = new Sequelize(config.db_database, config.db_username, config.db_password, {
  host: config.db_host,
  dialect: config.db_dialect,
  pool: {
    max: 25,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    charset: 'utf8mb4',
    dialectOptions: {
      collate: 'utf8_general_ci'
    },
    timestamps: false
  },
  logging: false, // console.debug
  operatorsAliases: false // Sequelize option required for legacy reasons
})

module.exports = sequelize
