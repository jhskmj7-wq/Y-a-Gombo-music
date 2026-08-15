const fs = require('fs');
const glob = require('glob'); // Note: we'll just write our own recursive search
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('dist')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('src');
for (const file of files) {
    let code = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    if (code.includes('addDoc(collection(db, "notifications")')) {
        // We'll replace await addDoc(collection(db, "notifications"), ...) with await NotificationService.sendNotification(...)
        // Let's use a robust regex. It might be multiline.
        const addDocRegex = /await\s+addDoc\(\s*collection\(\s*db\s*,\s*"notifications"\s*\)\s*,\s*(\{[\s\S]*?\})\s*\)/g;
        
        let newCode = code.replace(addDocRegex, 'await NotificationService.sendNotification($1)');
        
        // Also sometimes it passes a variable: await addDoc(collection(db, "notifications"), newNotif)
        const addDocVarRegex = /await\s+addDoc\(\s*collection\(\s*db\s*,\s*"notifications"\s*\)\s*,\s*([a-zA-Z0-9_]+)\s*\)/g;
        newCode = newCode.replace(addDocVarRegex, 'await NotificationService.sendNotification($1)');
        
        if (newCode !== code) {
            // Need to add import
            if (!newCode.includes('import { NotificationService }') && !newCode.includes('import {NotificationService}')) {
                // Find first import
                const importIdx = newCode.indexOf('import ');
                if (importIdx !== -1) {
                    let depth = file.split(path.sep).length - 2;
                    let prefix = depth === 0 ? './lib/' : '../'.repeat(depth) + 'lib/';
                    if (file === 'src/firebase.ts') prefix = './lib/';
                    
                    newCode = newCode.substring(0, importIdx) + `import { NotificationService } from "${prefix}NotificationService";\n` + newCode.substring(importIdx);
                }
            }
            fs.writeFileSync(file, newCode);
            console.log("Patched", file);
        }
    }
}
