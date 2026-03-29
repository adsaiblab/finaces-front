const fs = require('fs');
const dir = '/Users/adsa/Documents/aDSa.DEV/FinaCES/finaces-front/src/app/shared/components/atoms/finaces-risk-badge/finaces-risk-badge.component.ts';
let code = fs.readFileSync(dir, 'utf-8');
let transformed = code;
if (!transformed.includes('Input ') && !transformed.includes('Input,')) {
    transformed = transformed.replace(/import\s+{([^}]*)}\s+from\s+['"]@angular\/core['"](?:;)?/, 'import { $1, Input } from "@angular/core";');
}
transformed = transformed.replace(/(?:readonly\s+|public\s+|private\s+|protected\s+)?([a-zA-Z0-9_$]+)\s*(?::\s*[^=]+)?\s*=\s*input(\s*<[^>]*>)?\s*\(/g, '@Input() $1 = input$2(');
console.log(transformed);
