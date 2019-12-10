module.exports = {
    //"extends": "eslint:recommended",
    "extends": "airbnb",
    "plugins": [
        "codeceptjs",
        "chai-expect"
    ],
    "root": true,
    "env": {
        "codeceptjs/codeceptjs": true,
        "browser": true,
        "es6": true,
        "jest": true
    },
    "parser": "babel-eslint",
    "parserOptions": {
        "sourceType": "module",
        "ecmaVersion": "latest",
        "ecmaFeatures": {
            "jsx": true,
            "spread": true
        },
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
        "func-names": ["error", "never"],
        "import/no-extraneous-dependencies": ["error", {"devDependencies": true}],
        "no-restricted-syntax": ["off", "ForOfStatement"],
        "no-await-in-loop": ["off"],
        "no-param-reassign": ["error", {"props": false}],
        "no-console": ["off"],
        "chai-expect/no-inner-compare": 2,
        "chai-expect/no-inner-literal": 2,
        "chai-expect/missing-assertion": 2,
        "chai-expect/terminating-properties": 2
    }
};
