const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

walk('./src', (filePath) => {
    if (!filePath.endsWith('.svelte')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace goto('/...') with goto(`${base}/...`)
    content = content.replace(/goto\('(\/[^']*)'\)/g, 'goto(`${base}$1`)');
    
    // Replace goto(`/...`) with goto(`${base}/...`) (only if it starts with / and not ${base})
    content = content.replace(/goto\(\`(\/(?!\$\{base\})[^`]*)\`\)/g, 'goto(`${base}$1`)');
    
    // Replace href="/..." with href="{base}/..."
    content = content.replace(/href="(\/[^"]*)"/g, 'href="{base}$1"');

    if (content !== original) {
        if (!content.includes("import { base }")) {
            content = content.replace(/<script[^>]*>/, match => match + "\n\timport { base } from '$app/paths';");
        }
        fs.writeFileSync(filePath, content);
        console.log('Patched', filePath);
    }
});
