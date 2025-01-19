import prettier from 'eslint-config-prettier';

export default [
	{
		files: ['**/*.js', '**/*.ts'], // Dateitypen, die geprüft werden
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				console: 'readonly', // console als readonly definieren
				process: 'readonly', // process ist in Node.js global verfügbar
				__dirname: 'readonly', // __dirname ist in Node.js global verfügbar
				__filename: 'readonly', // __filename ist in Node.js global verfügbar
				module: 'readonly', // module ist in Node.js global verfügbar
				window: 'readonly', // window ist im Browser global verfügbar
				document: 'readonly', // document ist im Browser global verfügbar
				localStorage: 'readonly', // localStorage ist im Browser global verfügbar
				fetch: 'readonly', // fetch ist im modernen Browser global verfügbar
				alert: 'readonly', // alert ist im Browser global verfügbar
				describe: 'readonly', // Jest beschreibt globale Funktion
				it: 'readonly', // Jest testet globale Funktion
				expect: 'readonly', // Jest verwendet expect global
				beforeEach: 'readonly', // Jest Setup-Funktion
				afterEach: 'readonly', // Jest Teardown-Funktion
				BigInt: 'readonly', // BigInt in modernen JavaScript-Umgebungen
				globalThis: 'readonly', // globalThis ist in modernen JavaScript-Umgebungen verfügbar
				URL: 'readonly',
			},
		},
		plugins: {
			prettier,
		},
		rules: {
			...prettier.rules, // Deaktiviert Konflikte mit Prettier
			'no-unused-vars': 'warn', // Warnung für ungenutzte Variablen
			eqeqeq: 'warn', // Warnung bei Verwendung von == anstelle von ===
			'no-undef': 'error', // Verhindert die Nutzung nicht definierter Variablen.
			'no-console': 'warn', // Vermeidet den Einsatz von console.log (kann auf warn gestellt werden).
			'no-redeclare': 'error', // Verhindert die erneute Deklaration von Variablen.
			curly: 'warn', // Erzwingt geschweifte Klammern für Kontrollstrukturen wie if oder while.
			'consistent-return': 'warn', // Erzwingt, dass alle Pfade einer Funktion einen Rückgabewert haben.
			'no-shadow': 'error', // Verhindert das Überschreiben von Variablen im äußeren Geltungsbereich.
			'no-fallthrough': 'warn', // Warnt bei fehlendem break in switch-Anweisungen.
			'default-case': 'warn', // Erzwingt einen Standardfall (default) in switch-Anweisungen.
			'no-empty': 'warn', // Verhindert leere Codeblöcke.
			'no-eval': 'error',
			'no-implied-eval': 'error',
			'no-alert': 'warn',
			'prefer-const': 'error',
			'arrow-spacing': [
				'warn', // Kann auch "error" sein, wenn du es strenger machen möchtest
				{
					before: true, // Leerzeichen vor dem Pfeil
					after: true, // Leerzeichen nach dem Pfeil
				},
			],
			'no-var': 'error',
			'object-shorthand': 'warn',
			'prefer-template': 'error',
		},
		ignores: ['node_modules/'],
	},
];
