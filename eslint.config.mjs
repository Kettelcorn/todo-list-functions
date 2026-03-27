import js from '@eslint/js';
import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    {
        files: ['**/*.{js,mjs,cjs}'],
        plugins: { js },
        extends: ['js/recommended'],
        languageOptions: { globals: globals.node },
    },
    {
        files: ['**/*.{js,mjs,cjs}'],
        ...jsdoc.configs['flat/recommended'],
        rules: {
            ...jsdoc.configs['flat/recommended'].rules,
            'jsdoc/require-jsdoc': ['error', {
                require: {
                    FunctionDeclaration: true,
                    MethodDefinition: true,
                    ClassDeclaration: true,
                    ArrowFunctionExpression: false,
                    FunctionExpression: false,
                },
            }],
            'jsdoc/require-param-description': 'warn',
            'jsdoc/require-returns-description': 'warn',
        },
    },
    { files: ['**/*.js'], languageOptions: { sourceType: 'commonjs' } }
]);
