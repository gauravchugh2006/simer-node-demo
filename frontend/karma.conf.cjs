const istanbul = require('esbuild-plugin-istanbul');

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: ['src/**/*.{js,jsx}'],
    preprocessors: {
      'src/**/*.{js,jsx}': ['esbuild']
    },
    esbuild: {
      target: 'es2020',
      jsx: 'automatic',
      sourcemap: 'inline',
      plugins: [istanbul()]
    },
    reporters: ['progress', 'coverage', 'junit'],
    coverageReporter: {
      dir: 'coverage',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ],
      check: {
        global: { statements: 70, branches: 60, functions: 70, lines: 70 }
      }
    },
    junitReporter: {
      outputDir: 'coverage/junit'
    },
    browsers: ['ChromeHeadless'],
    singleRun: false,
    autoWatch: true,
    client: {
      jasmine: { random: false }
    },
    browserNoActivityTimeout: 120000,
    captureTimeout: 120000
  });
};
