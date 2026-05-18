const fs = require('fs');
const html = fs.readFileSync('../../rio-groove-cloudflare-final-corrigido/index.html', 'utf8');
const cheerio = require('cheerio');
const $ = cheerio.load(html);

const cards = [];
$('.product-card').each((i, el) => {
  if ($(el).attr('data-name') && $(el).attr('data-name').includes('Miguel')) {
    cards.push($(el).html());
  }
});
console.log('Cards found:', cards.length);
if (cards.length > 0) {
  console.log(cards[0]);
}
