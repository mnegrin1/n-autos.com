const fs = require('fs');
const src = '/Users/mauricionegrin/.gemini/antigravity/brain/c61ae8b2-51b7-4eee-b895-c7f7a999046f/emerald_silk_bg_1784414458311.jpg';
const dest = 'public/esmeralda-fluido.jpg';

fs.copyFileSync(src, dest);
console.log('Image copied successfully!');
