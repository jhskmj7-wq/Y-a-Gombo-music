with open("src/components/AdminCentre.tsx", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.strip().startswith('<div className={`flex h-screen'):
        for j in range(i, i+30):
            print(f"Line {j+1}: {lines[j].strip()}")
        break
