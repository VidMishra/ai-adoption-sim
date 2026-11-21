/* Inline src/ into a single shareable HTML file: dist/Tipping-Point.html */
const fs = require('fs'), path = require('path');
const src = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const safe = js => js.replace(/<\/script/gi, '<\\/script');
let html = src('index.html');
html = html.replace(/<!--STYLES-->[\s\S]*?<!--\/STYLES-->/, () => `<style>\n${src('styles.css')}\n</style>`);
html = html.replace(/<!--SCRIPTS-->[\s\S]*?<!--\/SCRIPTS-->/, () => ['data.js', 'engine.js', 'app.js'].map(f => `<script>\n${safe(src(f))}\n</script>`).join('\n'));
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
const out = path.join(__dirname, 'dist', 'Tipping-Point.html');
fs.writeFileSync(out, html);
console.log('Built', out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
