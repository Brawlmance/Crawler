const sequelize = require('./database')
const cron = require('./cron')

sequelize.sync().then(() => {
  cron()
})
