const chalk = require('chalk')
const cheerio = require('cheerio')
const spinner = require('simple-spinner')

const { requestGoogle, requestStackoverflow } = require('./request')

function beautify(stack) {
  return stack
    .replace(/^.*?\n/, str => chalk.red(str))
    .replace(/\(.*?:\d+:\d+\)/g, str => chalk.bgWhite.black(str))
}

async function handleError(err) {
  console.log(beautify(err.stack))
  console.log('\nLooking up solutions for you, please be patient...')
  spinner.start()

  try {
    const res = await requestGoogle(err.message)
    spinner.stop()
    const items = res.slice()

    let isRequested = false
    for ({ title, href } of items) {
      if (isRequested || !/stackoverflow/.test(href)) {
        return
      }

      const questionId = href.replace(/.*stackoverflow.com\/questions\/(\d+)\/.*/, '$1')
      const sta = await requestStackoverflow(questionId)
      const data = cheerio.load(sta).text()
      console.log(chalk.yellow(data))
      isRequested = true

      console.log(chalk.cyan('For more answers:'))
      console.log(chalk.blue.underline(href))

      const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(err.message)}`
      console.log(chalk.cyan('For more search results:'))
      console.log(chalk.blue.underline(googleUrl))
    }
  } catch (err) {
    console.log('Seems your network is down.')
    console.log('If you think this is a bug, please report at https://github.com/pd4d10/friendly-error/issues')
  }
}

module.exports = options => {
  process.on('uncaughtException', handleError)
}
