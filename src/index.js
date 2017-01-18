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
  proxy,
} = {}) => {
  async function handleError(err) {
    try {
      log(err.stack, (stack) => errorStack(stack
        .replace(/^.*?\n/, str => errorMessage(str))
        .replace(/\(.*?:\d+:\d+\)/g, str => breakPoint(str))
      ))
      log('')
      spinner.start()

      const res = await requestGoogle(err.message, proxy)
      spinner.stop()

      let isRequested = false
      for ({ title, href } of res) {
        if (isRequested) {
          return
        }

        const questionId = href.replace(/.*stackoverflow.com\/questions\/(\d+)\/.*/, '$1')
        const answerContent = await requestStackoverflow(questionId, proxy)

        // If no answer, try next link
        if (answerContent === '') {
          continue
        }

        const formatedAnswerContent = cheerio.load(answerContent).text()
        log(formatedAnswerContent, answer)
        isRequested = true

        log('For more answers:')
        // Sometimes google's results url is not the original url, like 'url?xxx'
        // This `replace` is to extract url from it.
        log(href.replace(/.*(http:\/\/stackoverflow.com\/questions\/\d+\/[^&]+).*/, '$1'), link)

        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(err.message)}`
        log('For more search results:')
        log(googleUrl, link)
      }
    } catch (err) {
      spinner.stop()
      log('There appears to be some trouble, aborted.')
      log('If you think this is a bug, please click url as follows to report issue:')
      log(chalk.cyan(`https://github.com/pd4d10/friendly-error/issues/new?title=${encodeURIComponent(err.message)}&body=${encodeURIComponent(err.stack)}`))
    }
  }

  process.on('uncaughtException', handleError)
}
