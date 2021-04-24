Object.defineProperty(exports, '__esModule', { value: true });
const readline = require('readline');
const chai = require('chai');

const { expect } = chai;

/**
 * Little helper gives the user some instructions to
 * walk through interactively, then prompts the
 * user whether it went ok or not, and if not - asks
 * for a one line explanation.
 *
 * @param instructions
 * @return Promise<Result>
 */
function interactive(instructions) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(`\n**** ${instructions}\nDid the test pass Y|n ? `, (didPass) => {
      console.log(`Read line: ${didPass}`);
      if (!didPass || didPass === 'y' || didPass === 'Y') {
        rl.close();
        resolve({ didPass: true, details: '' });
      } else {
        rl.question('Give a one-line explanation of what went wrong : ', (details) => {
          rl.close();
          resolve({ didPass: false, details });
        });
      }
    });
  });
}
exports.interactive = interactive;

const lambdaNotInteractive = () => {
  expect(!!'skipping interactive test').to.be.true;
};

/**
 * Little helper to detect if the test is running in interactive mode
 * (process.env[GEN3_INTERACTIVE] === "false")
 */
function isInteractive() {
  return process.env.GEN3_INTERACTIVE !== 'false';
}
exports.isInteractive = isInteractive;

/**
 * Little helper passes through the given lambda and
 * timeout if the GEN3_INTERACTIVE environment variable
 * is not false, otherwise returns a lambda with a do-nothing
 * body, so interactive tests can be disabled in non-interactive
 * environments
 *
 * return lambda
 */
// tslint:disable-next-line
function ifInteractive(lambda) {
  if (isInteractive()) {
    return lambda;
  }
  return lambdaNotInteractive;
}
exports.ifInteractive = ifInteractive;
