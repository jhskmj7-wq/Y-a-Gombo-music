import re

def fix_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Replacer code
    replacer_code = """const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return;
        seen.add(value);
      }
      return value;
    };
  };"""

    if "JSON.stringify(" in content and "getCircularReplacer" not in content:
        # Find where to put it or just replace JSON.stringify(...) with JSON.stringify(..., getCircularReplacer())
        content = content.replace(
            'JSON.stringify({',
            'JSON.stringify({'
        ) # this is tricky
    
fix_file('src/components/GomboProfile.tsx')
