const fs = require('fs');
const path = require('path');

const replaceInDir = (dir) => {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            replaceInDir(filePath);
        } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let changed = false;

            if (content.includes('http://localhost:5000')) {
                // handle template literals: `http://localhost:5000/api/...`
                content = content.replace(/`http:\/\/localhost:5000([^`]*)`/g, '`${process.env.REACT_APP_API_URL || \'http://localhost:5000\'}$1`');
                // handle single quotes: 'http://localhost:5000/api/...'
                content = content.replace(/'http:\/\/localhost:5000([^']*)'/g, '`${process.env.REACT_APP_API_URL || \'http://localhost:5000\'}$1`');
                // handle double quotes: "http://localhost:5000/api/..."
                content = content.replace(/"http:\/\/localhost:5000([^"]*)"/g, '`${process.env.REACT_APP_API_URL || \'http://localhost:5000\'}$1`');
                
                fs.writeFileSync(filePath, content);
                console.log(`Updated ${filePath}`);
            }
        }
    });
};

replaceInDir('client/src');
console.log('Done!');
