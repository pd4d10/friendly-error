const chalk = require('chalk')
const cheerio = require('cheerio')
const spinner = require('simple-spinner')

const { requestGoogle, requestStackoverflow } = require('./request')

// Simple wrapper for `console.log`
function log(content, beautify) {
  if (typeof beautify === 'function') {
    return console.log(beautify(content))
  }
  return console.log(content)
}

module.exports = ({
  message = chalk.red,
  position = chalk.bgWhite.black,
  answer = chalk.yellow,
  description = chalk.cyan,
  url = chalk.blue.underline,
} = {}) => {
  async function handleError(err) {
    try {
      log(err.stack, (stack) => stack
        .replace(/^.*?\n/, str => message(str))
        .replace(/\(.*?:\d+:\d+\)/g, str => position(str))
      )
      log('\nLooking up solutions for you, please be patient...\n')

      spinner.start()

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
        log(data, answer)
        isRequested = true

        log('For more answers:', description)
        log(href, url)

        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(err.message)}`
        log('For more search results:', description)
        log(googleUrl, url)
      }
    } catch (err) {
      log('Seems your network is down.')
      log('If you think this is a bug, please report at https://github.com/pd4d10/friendly-error/issues')
    }
  }

  process.on('uncaughtException', handleError)
}
