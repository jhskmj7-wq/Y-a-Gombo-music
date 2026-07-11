with open("src/components/AdminCentre.tsx", "r") as f:
    lines = f.readlines()

in_admin_centre = False
for i, line in enumerate(lines):
    if "export default function AdminCentre" in line:
        in_admin_centre = True
    
    if in_admin_centre and line.strip().startswith("return ("):
        print(f"Line {i+1}: {line.strip()}")
        # Check next line to make sure it's the main container
        print(f"Line {i+2}: {lines[i+1].strip()}")
        break
