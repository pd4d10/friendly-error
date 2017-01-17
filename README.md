# friendly-error

Show uncaught errors friendly in Node.js.

![Demo](https://raw.githubusercontent.com/pd4d10/friendly-error/master/assets/demo.gif)

## Usage

```sh
npm install --save friendly-error
```

Then add a line at the beginning of your entry file:

```js
require('friendly-error')()
```

That's it.

It use Google, so make sure you have network access to Google. StackOverflow's search API seems not working as expected.

## Configuration

If you don't like default colors, you could change it easily.

Default configuration is as follows:

```js
require('friendly-error')({
  errorMessage: chalk.red, // Error message
  errorStack: chalk.reset // Error stack
  breakPoint: chalk.bgWhite.black, // Break point where error happens
  answer: chalk.yellow // Best answer from stackoverflow
  link: chalk.cyan.underline // Links
})
```

Visit [chalk](https://github.com/chalk/chalk) for more information.

## License

MIT
