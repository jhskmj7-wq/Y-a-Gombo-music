import re

with open('src/index.css', 'r') as f:
    content = f.read()

# Replace the .imperial, .dark block and .light block
css_vars = """
:root {
  --afri-gold: #D4AF37;
  --afri-gold-light: #FFD95A;
}

.imperial, .dark {
  --afri-bg: #050505;
  --afri-bg-sec: #111111;
  --afri-bg-ter: #181818;
  --afri-bg-action: #222222;
  --afri-bar: #0B0B0C;
  --afri-text: #FFFFFF;
  --afri-text-sec: #B9B9B9;
  --afri-text-muted: #777777;
  --afri-border: rgba(212, 175, 55, 0.2);
}

.light {
  --afri-bg: #F9F8F6;
  --afri-bg-sec: #FFFFFF;
  --afri-bg-ter: #FAF0E6;
  --afri-bg-action: #EAE0D5;
  --afri-bar: #E2E2E2;
  --afri-text: #333333;
  --afri-text-sec: #737373;
  --afri-text-muted: #999999;
  --afri-border: #E5E5E5;
}
"""

content = re.sub(r':root\s*\{.*?\.light\s*\{.*?\}', css_vars.strip(), content, flags=re.DOTALL)

# Add new colors to @theme
theme_additions = """
  --color-afri-bg: var(--afri-bg);
  --color-afri-bg-sec: var(--afri-bg-sec);
  --color-afri-bg-ter: var(--afri-bg-ter);
  --color-afri-bg-action: var(--afri-bg-action);
  --color-afri-bar: var(--afri-bar);
  --color-afri-gold: var(--afri-gold);
  --color-afri-gold-light: var(--afri-gold-light);
  --color-afri-text: var(--afri-text);
  --color-afri-text-sec: var(--afri-text-sec);
  --color-afri-text-muted: var(--afri-text-muted);
  --color-afri-border: var(--afri-border);
"""

# Replace existing theme vars with the new ones
content = re.sub(r'--color-afri-bg:.*?;.*?--color-afri-border:.*?;', theme_additions.strip(), content, flags=re.DOTALL)

with open('src/index.css', 'w') as f:
    f.write(content)
