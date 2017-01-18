const url = require('url')
const qs = require('querystring')
const fetch = require('node-fetch')
const cheerio = require('cheerio')
const Socks5Agent = require('socks5-https-client/lib/Agent')
const HttpAgent = require('http-proxy-agent')

function getAgentFromProxy(proxy) {
  // No agent
  if (typeof proxy === 'undefined') {
    return null
  }

  if (typeof proxy !== 'string') {
    throw new Error('Proxy must be a string, please check it')
  }

  const { protocol, hostname, port } = url.parse(proxy)

  switch (protocol) {
    case 'http:':
    case 'https:':
      return new HttpAgent(proxy)
    case 'socks5:':
      return new Socks5Agent({
        socksHost: hostname,
        socksPort: port,
      })
    default:
      throw new Error('Proxy not valid, please check it')
  }
}

async function requestGoogle(message, proxy) {
  const keyword = encodeURIComponent(`${message} site:stackoverflow.com`)
  const res = await fetch(`https://www.google.com/search?q=${keyword}`, {
    agent: getAgentFromProxy(proxy),
  })
  const text = await res.text()
  const $ = cheerio.load(text)

  return $('h3.r>a').map(function () {
    const $this = $(this)

    return {
      title: $this.text(),
      href: $this.attr('href'),
    }
  }).get()
}

async function requestStackoverflow(id, proxy) {
  const params = qs.stringify({
    // Votes desc
    order: 'desc',
    sort: 'votes',
    site: 'stackoverflow',
    // Filter field is generated from https://api.stackexchange.com/docs/answers-on-questions
    // query only `body` and `is_accepted` field
    filter: '!bGqd9*)(j28_aP',
  })

  const res = await fetch(`https://api.stackexchange.com/2.2/questions/${id}/answers?${params}`, {
    agent: getAgentFromProxy(proxy),
  })
  const { items } = await res.json()

  // No answer
  if (items.length === 0) {
    return ''
  }

  const acceptedAnswers = items.filter(item => item.is_accepted)

  // If no answer is accepted, use the most votes
  if (acceptedAnswers.length === 0) {
    return items[0].body
  }

  return acceptedAnswers[0].body
}

exports.requestGoogle = requestGoogle
exports.requestStackoverflow = requestStackoverflow
