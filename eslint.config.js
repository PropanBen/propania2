import path from 'path';
import { fileURLToPath } from 'url';

// Definiere __dirname und __filename manuell für ES-Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import prettierConfig from 'eslint-config-prettier';
import typescriptParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
	// Konfiguration für JavaScript-Dateien
	{
		files: ['**/*.js'], // Nur JavaScript-Dateien
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				console: 'readonly',
				process: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				module: 'readonly',
				window: 'readonly',
				document: 'readonly',
				localStorage: 'readonly',
				fetch: 'readonly',
				alert: 'readonly',
			},
		},
		plugins: {
			prettier: prettierConfig,
		},
		rules: {
			...prettierConfig.rules, // Prettier-Regeln
			eqeqeq: 'warn', // Enforce === over ==
			'no-console': 'warn', // Discourage console.log
			'no-redeclare': 'error', // Prevent variable redeclaration
			curly: 'warn', // Enforce braces in control structures
			'consistent-return': 'warn', // Enforce consistent return values
			'no-shadow': 'error', // Prevent shadowing of variables
			'no-fallthrough': 'warn', // Warn about missing breaks in switch
			'default-case': 'warn', // Require default case in switch
			'no-empty': 'warn', // Warn on empty blocks
			'no-eval': 'error', // Disallow eval
			'no-implied-eval': 'error', // Disallow implied eval
			'no-alert': 'warn', // Discourage alert usage
			'prefer-const': 'error', // Prefer const for variables
			'arrow-spacing': ['warn', { before: true, after: true }], // Enforce spacing in arrow functions
			'no-var': 'error', // Disallow var
			'object-shorthand': 'warn', // Prefer object shorthand
			'prefer-template': 'error',
		},
		ignores: ['node_modules/', 'dist/'], // Ignorierte Ordner
	},

	// Konfiguration für TypeScript-Dateien
	{
		files: ['**/*.ts'], // Nur TypeScript-Dateien
		languageOptions: {
			parser: typescriptParser,
			parserOptions: {
				tsconfigRootDir: __dirname,
				project: ['./backend/tsconfig.json', './frontend/tsconfig.json'], // Pfade zu den tsconfig.json
			},
		},
		plugins: {
			prettier: prettierConfig,
			'@typescript-eslint': tsPlugin,
		},
		rules: {
			...prettierConfig.rules, // Prettier-Regeln
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{ argsIgnorePattern: '^_' },
			], // Warn about unused variables, ignore _ prefix
			'@typescript-eslint/consistent-type-imports': 'warn', // Prefer consistent type imports
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unsafe-assignment': 'warn',
			eqeqeq: 'warn', // Enforce === over ==
			'no-console': 'warn', // Discourage console.log
			'no-redeclare': 'error', // Prevent variable redeclaration
			curly: 'warn', // Enforce braces in control structures
			'consistent-return': 'warn', // Enforce consistent return values
			'no-shadow': 'error', // Prevent shadowing of variables
			'no-fallthrough': 'warn', // Warn about missing breaks in switch
			'default-case': 'warn', // Require default case in switch
			'no-empty': 'warn', // Warn on empty blocks
			'no-eval': 'error', // Disallow eval
			'no-implied-eval': 'error', // Disallow implied eval
			'no-alert': 'warn', // Discourage alert usage
			'prefer-const': 'error', // Prefer const for variables
			'arrow-spacing': ['warn', { before: true, after: true }], // Enforce spacing in arrow functions
			'no-var': 'error', // Disallow var
			'object-shorthand': 'warn', // Prefer object shorthand
			'prefer-template': 'error',
		},
		ignores: ['node_modules/', 'dist/'], // Ignorierte Ordner
	},
];
