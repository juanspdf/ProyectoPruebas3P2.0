const js = require('@eslint/js');

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                // Node.js globals
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly',
                global: 'readonly',
                console: 'readonly',
                
                // Jest globals
                describe: 'readonly',
                test: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                jest: 'readonly'
            }
        },
        rules: {
            'indent': ['error', 4],
            'linebreak-style': ['error', 'windows'],
            'quotes': ['error', 'single'],
            'semi': ['error', 'always'],
            'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
            'no-console': 'off',
            'comma-dangle': ['error', 'never'],
            'object-curly-spacing': ['error', 'always'],
            'array-bracket-spacing': ['error', 'never'],
            'max-len': ['error', { 'code': 100 }],
            'no-trailing-spaces': 'error',
            'space-before-function-paren': ['error', 'never'],
            'keyword-spacing': 'error',
            'space-infix-ops': 'error'
        },
        ignores: [
            'node_modules/',
            'coverage/',
            'public/',
            '*.config.js'
        ]
    }
];
