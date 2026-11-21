const fs = require('fs');
const path = require('path');

function getEnvVars() {
  const envVars = {};
  const envFiles = ['.env', '.env.production', '.env.development'];
  for (const file of envFiles) {
    const fullPath = path.resolve(__dirname, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match && !match[1].startsWith('#')) {
          let v = (match[2] || '').trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
          }
          if (envVars[match[1]] === undefined) {
            envVars[match[1]] = v;
          }
        }
      });
      break;
    }
  }
  return envVars;
}

const envVars = getEnvVars();

function inlineEnvPlugin({ types: t }) {
  return {
    visitor: {
      MemberExpression(nodePath) {
        if (nodePath.get('object').matchesPattern('process.env')) {
          const key = nodePath.toComputedKey();
          if (t.isStringLiteral(key) && envVars[key.value] !== undefined) {
            nodePath.replaceWith(t.stringLiteral(envVars[key.value]));
          }
        }
      },
    },
  };
}

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './src',
          '@app': './src/app',
          '@components': './src/components',
          '@utils': './src/utils',
        },
      },
    ],
    inlineEnvPlugin,
    'react-native-worklets/plugin',
  ],
};
