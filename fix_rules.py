import re

with open('firestore.rules', 'r') as f:
    content = f.read()

# Relax isValidUser rule
new_rule = """    function isValidUser(data) {
      return data.uid == request.auth.uid &&
             data.email is string;
    }"""
content = re.sub(r'function isValidUser\(data\) \{.*?\}', new_rule, content, flags=re.DOTALL)

# Relax user create rule (remove isVerified check)
content = content.replace(
    'allow create: if isOwner(userId) && isValidUser(incoming()) && incoming().isVerified == false;',
    'allow create: if isOwner(userId) && isValidUser(incoming());'
)

with open('firestore.rules', 'w') as f:
    f.write(content)
