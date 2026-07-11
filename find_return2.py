with open("src/components/AdminCentre.tsx", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.startswith("  return ("):
        print(f"Line {i+1}: {line.strip()}")
        print(f"Line {i+2}: {lines[i+1].strip()}")
        print(f"Line {i+3}: {lines[i+2].strip()}")
