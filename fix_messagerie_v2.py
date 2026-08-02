import re

def fix_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Remove AndroidPageLayout wrapper
    content = content.replace("<AndroidPageLayout scrollable={false}>", "")
    content = content.replace("</AndroidPageLayout>", "")

    with open(filename, 'w') as f:
        f.write(content)

fix_file('src/components/MessagesView.tsx')
