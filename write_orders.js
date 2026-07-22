const fs = require('fs');
const content = fs.readFileSync(__dirname + '/orders_new.tsx', 'utf8');
fs.writeFileSync(__dirname + '/app/orders/page.tsx', content, 'utf8');
console.log('Written', content.split('\n').length, 'lines');
