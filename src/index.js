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
  errorMessage = chalk.red,
  errorStack = chalk.reset,
  breakPoint = chalk.bgWhite.black,
  answer = chalk.yellow,
  link = chalk.cyan.underline,
} = {}) => {
  async function handleError(err) {
    try {
      log(err.stack, (stack) => errorStack(stack
        .replace(/^.*?\n/, str => errorMessage(str))
        .replace(/\(.*?:\d+:\d+\)/g, str => breakPoint(str))
      ))
      log('')
      spinner.start()

      const res = await requestGoogle(err.message)
      spinner.stop()
      const items = res.slice()

      let isRequested = false
      for ({ title, href } of items) {
        if (isRequested) {
          return
        }

        const questionId = href.replace(/.*stackoverflow.com\/questions\/(\d+)\/.*/, '$1')
        const answerContent = await requestStackoverflow(questionId)

        // If no answer, try next link
        if (answerContent === '') {
          continue
        }

        const formatedAnswerContent = cheerio.load(answerContent).text()
        log(formatedAnswerContent, answer)
        isRequested = true

        log('For more answers:')
        log(href, link)

        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(err.message)}`
        log('For more search results:')
        log(googleUrl, link)
      }
    } catch (err) {
      spinner.stop()
      log('There appears to be trouble with your network connection, aborted.')
      log(err)
    }
  }

  process.on('uncaughtException', handleError)
}
