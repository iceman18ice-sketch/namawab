const fs = require('fs');
const path = require('path');

const replacements = [
    { from: /مستشفى نما الطبي/g, to: 'المركز الطبي' },
    { from: /نما الطبي/g, to: 'المركز الطبي' },
    { from: /Nama Medical ERP/gi, to: 'Medical ERP' },
    { from: /Nama Medical/gi, to: 'Medical Center' },
    { from: /Nama/g, to: 'Medical' },
    { from: /نما/g, to: 'المركز' }
];

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // We want to avoid breaking URLs, variables like 'namaLang', 'nama_medical_web', etc.
    // Actually, simple regex might break "namaLang" -> "MedicalLang".
    // Let's be careful.
    
    // UI replacements
    content = content.replace(/مستشفى نما الطبي/g, 'المركز الطبي');
    content = content.replace(/نما الطبي/g, 'المركز الطبي');
    content = content.replace(/Nama Medical ERP/g, 'Medical ERP');
    content = content.replace(/Nama Medical/g, 'Medical Center');
    content = content.replace(/>Nama</g, '>Medical<'); // inside HTML tags
    content = content.replace(/>نما</g, '>المركز<');
    content = content.replace(/نما/g, 'المركز'); // Arabic is mostly safe in text
    
    // specifically target page titles
    content = content.replace(/Nama/g, 'Medical'); // This might be too aggressive, let's test. Wait, it will break `namaLang`
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated:', filePath);
    }
}

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'backups') {
                processDir(fullPath);
            }
        } else {
            const ext = path.extname(file);
            if (['.html', '.js', '.css', '.md', '.bat'].includes(ext)) {
                // Ignore this script itself
                if (file === 'replace_name.js') continue;
                // Read and replace safely
                let content = fs.readFileSync(fullPath, 'utf8');
                let newContent = content
                    .replace(/مستشفى نما الطبي/g, 'المركز الطبي')
                    .replace(/نما الطبي/g, 'المركز الطبي')
                    .replace(/Nama Medical ERP/g, 'Medical ERP')
                    .replace(/Nama Medical/g, 'Medical Center')
                    .replace(/نما/g, 'المركز')
                    // For "Nama", we only replace it if it's a whole word to avoid breaking 'namaLang', 'nama_medical_web', etc.
                    .replace(/\bNama\b/g, 'Medical');
                
                if (newContent !== content) {
                    fs.writeFileSync(fullPath, newContent, 'utf8');
                    console.log('Updated:', fullPath);
                }
            }
        }
    }
}

processDir(__dirname);
console.log('Done!');
