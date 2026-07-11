with open("src/components/AdminCentre.tsx", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "<header" in line or "header" in line.lower():
        for j in range(i, i+5):
            print(f"Line {j+1}: {lines[j].strip()}")
        break
