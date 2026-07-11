with open("src/components/AdminCentre.tsx", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "<GomboTopNav" in line:
        for j in range(i-5, i+5):
            print(f"Line {j+1}: {lines[j].strip()}")
        break
