# ESLINT Integration

ESLint is integrated into Gen3-QA code. The lint code runs for each code push to a branch and on each PR request.

## Code changes to facilitate the integration:
1. package.json (modified):
   1.  New packages (devDependencies) - 
       1. eslint
       1. eslint-config-airbnb
       1. eslint-plugin-chai-expect
       1. eslint-plugin-chai-friendly
       1. eslint-plugin-codeceptjs
       1. lint-diff
   1. Additional script definition:
       1. "eslintdiff": "lint-diff $TRAVIS_COMMIT_RANGE"
       1. "eslint": "eslint --ignore-path .gitignore ." -- (To be enabled after complete cleanup of code)
       
1. .eslintrc.js (added): This contains all the rules defined for eslint execution.

1. .travis.yml (added): This is where the script to be be run as a part of Travis-CI is defined.

## Usage and Documentation

1. lint-diff: [https://www.npmjs.com/package/lint-diff](https://www.npmjs.com/package/lint-diff)
1. eslint: [https://www.npmjs.com/package/eslint](https://www.npmjs.com/package/eslint)