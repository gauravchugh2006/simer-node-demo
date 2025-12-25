const { createInstrumenter } = require('istanbul-lib-instrument');
const fs = require('fs');
const path = require('path');

const istanbulPlugin = () => ({
  name: 'istanbul-instrumenter',
  setup(build) {
    const instrumenter = createInstrumenter({ esModules: true, produceSourceMap: true });

    build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
      const source = await fs.promises.readFile(args.path, 'utf8');
      const instrumented = instrumenter.instrumentSync(source, args.path);
      const map = instrumenter.lastSourceMap();

      const ext = path.extname(args.path);
      let loader = 'js';
      if (ext === '.jsx') loader = 'jsx';
      else if (ext === '.ts') loader = 'ts';
      else if (ext === '.tsx') loader = 'tsx';

      return { contents: instrumented, loader, sourcemap: map };
    });
  }
});

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
      plugins: [istanbulPlugin()]
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
