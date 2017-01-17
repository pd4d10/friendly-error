const chalk = require('chalk')
const cheerio = require('cheerio')
const spinner = require('simple-spinner')

const { requestGoogle, requestStackoverflow } = require('./request')

module.exports = ({
  messageColor = chalk.red,
  positionColor = chalk.bgWhite.black,
  answerColor = chalk.yellow,
  descriptionColor = chalk.cyan,
  urlColor = chalk.blue.underline,
} = {}) => {
  function beautify(stack) {
    return stack
      .replace(/^.*?\n/, str => messageColor(str))
      .replace(/\(.*?:\d+:\d+\)/g, str => positionColor(str))
  }

  process.on('uncaughtException', async function handleError(err) {
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
        console.log(answerColor(data))
        isRequested = true

        console.log(descriptionColor('For more answers:'))
        console.log(urlColor(href))

        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(err.message)}`
        console.log(descriptionColor('For more search results:'))
        console.log(urlColor(googleUrl))
      }
    } catch (err) {
      console.log('Seems your network is down.')
      console.log('If you think this is a bug, please report at https://github.com/pd4d10/friendly-error/issues')
    }
  })
}
