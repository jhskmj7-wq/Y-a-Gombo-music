const fs = require('fs');
let code = fs.readFileSync('src/components/GawaCenter.tsx', 'utf8');

let brace = 0;
let paren = 0;
let lineNum = 1;
for (let i = 0; i < code.length; i++) {
  if (code[i] === '\n') lineNum++;
  if (code[i] === '{') brace++;
  if (code[i] === '}') brace--;
  if (code[i] === '(') paren++;
  if (code[i] === ')') paren--;
}
console.log('Braces:', brace, 'Parens:', paren, 'Lines:', lineNum);
