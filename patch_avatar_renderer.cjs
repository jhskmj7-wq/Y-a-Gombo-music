const fs = require('fs');
const file = 'src/components/avatar/AvatarRenderer.tsx';
let content = fs.readFileSync(file, 'utf8');

// replace dangerouslySetInnerHTML logic to also support imageUrl
content = content.replace(
  /dangerouslySetInnerHTML=\{\{ __html: item\.svgContent \}\}/,
  `{...(item.svgContent ? { dangerouslySetInnerHTML: { __html: item.svgContent } } : {})} 
          {...(!item.svgContent && item.imageUrl ? { dangerouslySetInnerHTML: { __html: \`<image href="\${item.imageUrl}" width="200" height="200" preserveAspectRatio="xMidYMid slice" />\` } } : {})}`
);

fs.writeFileSync(file, content);
