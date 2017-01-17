const qs = require('querystring')
const fetch = require('node-fetch')
const google = require('google')

function requestGoogle(keyword) {
  return new Promise((resolve, reject) => {
    google(keyword, (err, res) => {
      if (err) {
        return reject(err)
      }
      return resolve(res.links)
    })
  })
}

async function requestStackoverflow(id) {
  const params = qs.stringify({
    order: 'desc',
    sort: 'votes',
    site: 'stackoverflow',
    filter: '!bGqd9*)(j28_aP', // generated from https://api.stackexchange.com/docs/answers-on-questions
    // query only `body` and `is_accepted` field
  })
  const res = await fetch(`https://api.stackexchange.com/2.2/questions/${id}/answers?${params}`)
  const { items } = await res.json()

  const acceptedAnswers = items.filter(item => item.is_accepted)

  // If no answer is accepted, use the most votes
  if (acceptedAnswers.length === 0) {
    return items[0].body
  }

  return acceptedAnswers[0].body
}

exports.requestGoogle = requestGoogle
exports.requestStackoverflow = requestStackoverflow
