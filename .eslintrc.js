module.exports = {
    "extends": [
        "airbnb",
        "plugin:json/recommended",
        "plugin:codeceptjs/recommended",
        "plugin:chai-expect/recommended",
        "plugin:chai-friendly/recommended"
    ],
    "root": true,
    "env": {
        "browser": true,
        "es6": true,
        "jest": true,
        'mocha': true
    },
    "parser": "babel-eslint",
    "parserOptions": {
        "sourceType": "module",
        "ecmaVersion": "11",
        "ecmaFeatures": {
            "jsx": true,
            "spread": true
        },
    },
    "globals": {
        "Given": false,
        "When": false,
        "Then": false,
        "And": false
    },
    "rules": {
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-underscore-dangle": ["error", {"allowAfterThis": true}],
        "func-names": ["error", "never"],
        "import/no-extraneous-dependencies": ["error", {"devDependencies": true}],
        "no-restricted-syntax": ["off", "ForOfStatement"],
        "no-await-in-loop": ["off"],
        "no-param-reassign": ["error", {"props": false}],
        "no-console": ["off"]
    },
    "overrides": [
      {
        "files": ["guppySequences.js"],
        "rules": {
          "no-underscore-dangle": "off"
        }
      }
    ]
};
