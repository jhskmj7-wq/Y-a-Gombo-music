sed -i 's/<table className="w-full text-left border-collapse">/<div className="overflow-x-auto w-full"><table className="w-full text-left border-collapse min-w-[600px]">/' src/components/admin/AdminSecurity.tsx
sed -i 's/<\/table>/<\/table><\/div>/' src/components/admin/AdminSecurity.tsx

sed -i 's/<table className="w-full text-\[10.5px\] font-mono text-left">/<div className="overflow-x-auto w-full"><table className="w-full text-[10.5px] font-mono text-left min-w-[800px]">/' src/components/admin/MultimediaCenter.tsx
sed -i 's/<\/table>/<\/table><\/div>/' src/components/admin/MultimediaCenter.tsx

sed -i 's/<table className="w-full text-left text-xs text-afri-text-sec">/<div className="overflow-x-auto w-full"><table className="w-full text-left text-xs text-afri-text-sec min-w-[600px]">/' src/components/admin/avatar/AvatarItemsTable.tsx
sed -i 's/<\/table>/<\/table><\/div>/' src/components/admin/avatar/AvatarItemsTable.tsx
