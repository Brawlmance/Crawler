const Sequelize = require('sequelize')
const sequelize = require(process.env.PWD + '/database')

const Patch = sequelize.define('patch', {
  id: Sequelize.STRING,
  timestamp: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true
  },
  changes: {
    type: Sequelize.ENUM,
    values: ['1', '0']
  }
}, {
  indexes: [
    {
      fields: ['changes', 'id']
    }
  ]
})

module.exports = Patch
