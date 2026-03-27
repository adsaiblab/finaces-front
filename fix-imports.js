const fs = require('fs');
const errors = fs.readFileSync('build_errors.txt', 'utf8');
const fileFixes = {};

const missingMap = {
  "'ngClass'": 'NgClass',
  "'ngStyle'": 'NgStyle',
  "'number'": 'DecimalPipe',
  "'date'": 'DatePipe',
  "'percent'": 'PercentPipe',
  "'json'": 'JsonPipe',
  "'async'": 'AsyncPipe',
  "'slice'": 'SlicePipe',
  "'titlecase'": 'TitleCasePipe',
  "'currency'": 'CurrencyPipe'
};

const blocks = errors.split('NG800');
blocks.forEach(block => {
  let matchedDeps = [];
  Object.keys(missingMap).forEach(key => {
    if (block.includes(key)) {
      matchedDeps.push(missingMap[key]);
    }
  });
  
  const tsMatch = block.match(/ (src\/app\/.*?\.ts):\d+:\d+:/);
  if (tsMatch && matchedDeps.length > 0) {
    const file = tsMatch[1];
    if (!fileFixes[file]) fileFixes[file] = new Set();
    matchedDeps.forEach(dep => fileFixes[file].add(dep));
  }
});

Object.keys(fileFixes).forEach(file => {
  const deps = Array.from(fileFixes[file]);
  let content = fs.readFileSync(file, 'utf8');
  
  const importStr = `import { ${deps.join(', ')} } from '@angular/common';\n`;
  content = importStr + content;
  
  const importRegex = /imports\s*:\s*\[([^\]]*)\]/;
  const match = content.match(importRegex);
  if (match) {
    let existing = match[1].trim();
    if (existing.endsWith(',')) existing = existing.slice(0, -1);
    const addition = deps.join(', ');
    const newImports = existing.length > 0 ? existing + ', ' + addition : addition;
    content = content.replace(importRegex, `imports: [${newImports}]`);
  }
  
  fs.writeFileSync(file, content);
});
console.log("Files patched: " + Object.keys(fileFixes).length);
