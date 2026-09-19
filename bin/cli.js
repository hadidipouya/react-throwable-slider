#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cyan = (text) => `\x1b[36m${text}\x1b[0m`;
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;
const bold = (text) => `\x1b[1m${text}\x1b[0m`;
const gray = (text) => `\x1b[90m${text}\x1b[0m`;

function showHelp() {
  console.log(`
${bold('react-throwable-slider')} — Slingshot-powered reactive slider for React & Tailwind CSS
${gray('Created by Pouya Hadidi (https://pouyahadidi.ir • contact@pouyahadidi.ir)')}

${bold('USAGE:')}
  ${cyan('npx react-throwable-slider')} [destination-path] [options]

${bold('OPTIONS:')}
  ${cyan('-y, --yes')}        Skip confirmation prompt and use default path
  ${cyan('-h, --help')}       Show this help message

${bold('EXAMPLES:')}
  ${cyan('npx react-throwable-slider')}
  ${cyan('npx react-throwable-slider')} src/components/ui
  ${cyan('npx react-throwable-slider')} components/ThrowableSlider.tsx -y
`);
}

async function prompt(question, defaultVal) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultVal);
    });
  });
}

function detectDefaultDirectory() {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'src', 'components', 'ui'))) {
    return path.join('src', 'components', 'ui');
  }
  if (fs.existsSync(path.join(cwd, 'src', 'components'))) {
    return path.join('src', 'components');
  }
  if (fs.existsSync(path.join(cwd, 'components', 'ui'))) {
    return path.join('components', 'ui');
  }
  if (fs.existsSync(path.join(cwd, 'components'))) {
    return path.join('components');
  }
  if (fs.existsSync(path.join(cwd, 'src'))) {
    return path.join('src', 'components');
  }
  return 'components';
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  const autoYes = args.includes('-y') || args.includes('--yes');
  const pathArg = args.find((arg) => !arg.startsWith('-'));

  console.log(`\n${bold('🎯 React Throwable Slider — Component Importer')} ${gray('by Pouya Hadidi (pouyahadidi.ir)')}\n`);

  // Locate source component
  const sourcePath = path.resolve(__dirname, '../src/ThrowableSlider.tsx');
  if (!fs.existsSync(sourcePath)) {
    console.error(`\x1b[31mError:\x1b[0m Could not locate source file at ${sourcePath}`);
    process.exit(1);
  }

  let targetDir = pathArg || detectDefaultDirectory();
  let targetFile = 'ThrowableSlider.tsx';

  if (targetDir.endsWith('.tsx') || targetDir.endsWith('.jsx')) {
    targetFile = path.basename(targetDir);
    targetDir = path.dirname(targetDir);
  }

  if (!autoYes && !pathArg) {
    const response = await prompt(
      `${bold('Where would you like to save the component?')} ${gray(`(${targetDir})`)}: `,
      targetDir
    );
    if (response.endsWith('.tsx') || response.endsWith('.jsx')) {
      targetFile = path.basename(response);
      targetDir = path.dirname(response);
    } else {
      targetDir = response;
    }
  }

  const destinationDir = path.resolve(process.cwd(), targetDir);
  const destinationFile = path.join(destinationDir, targetFile);

  // Create directory if it doesn't exist
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }

  // Check if file already exists
  if (fs.existsSync(destinationFile) && !autoYes) {
    const overwrite = await prompt(
      `${yellow('Warning:')} ${destinationFile} already exists. Overwrite? (y/N): `,
      'n'
    );
    if (overwrite.toLowerCase() !== 'y') {
      console.log(gray('\nAborted. No files were modified.\n'));
      process.exit(0);
    }
  }

  // Copy component
  fs.copyFileSync(sourcePath, destinationFile);

  const relativeDest = path.relative(process.cwd(), destinationFile);
  console.log(`\n${green('✔')} Successfully installed ${bold(relativeDest)}!\n`);

  console.log(`${bold('Quick Start:')}`);
  console.log(gray(`----------------------------------------------------------------`));
  const importPath = relativeDest
    .replace(/\.(tsx|jsx)$/, '')
    .replace(/^(src\/|.\/)/, '@/')
    .replace(/^src\//, '@/');
  
  console.log(`
import { ThrowableSlider } from '${importPath}';

export default function MyComponent() {
  return (
    <div className="w-80 p-6 bg-neutral-900 rounded-xl">
      <ThrowableSlider
        label="Volume"
        unit="%"
        defaultValue={50}
        min={0}
        max={100}
        step={1}
        accentColor="#6366f1"
        onChange={(val) => console.log('Value:', val)}
      />
    </div>
  );
}
`);
  console.log(gray(`----------------------------------------------------------------`));
  console.log(`${cyan('Tip:')} Ensure Tailwind CSS is configured in your project for optimal styling.\n`);
}

main().catch((err) => {
  console.error('\x1b[31mUnexpected error:\x1b[0m', err);
  process.exit(1);
});
