const sequelize = require('./database')
const cron = require('./cron')

async function main() {
  await sequelize.sync()
  cron()
}

main()
