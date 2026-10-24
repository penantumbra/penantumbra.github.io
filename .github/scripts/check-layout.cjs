const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const articles = fs.readdirSync('_site', { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => ({ slug: entry.name, file: path.join('_site', entry.name, 'index.html') }))
    .filter(entry => fs.existsSync(entry.file) && fs.readFileSync(entry.file, 'utf8').includes('class="post-page"'));
  if (!articles.length) throw new Error('No article pages found');
  fs.mkdirSync('layout-screenshots', { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const width of [375, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      // Keep checks deterministic: the local site must not depend on third-party
      // scripts or remote illustrations to establish its reading layout.
      await page.route('https://**', route => route.abort());
      for (const { slug } of articles) {
        await page.goto(`http://127.0.0.1:8765/${slug}/`, { waitUntil: 'networkidle' });
        const result = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          headings: document.querySelectorAll('h1').length,
          main: document.querySelectorAll('main').length,
          article: document.querySelectorAll('article').length,
          alignment: getComputedStyle(document.querySelector('.post-body')).textAlign,
          brokenImages: [...document.querySelectorAll('img[src^="/"]')]
            .filter(img => !img.complete || !img.naturalWidth).map(img => img.getAttribute('src')),
        }));
        if (result.scrollWidth > width + 1 || result.headings !== 1 || result.main !== 1 ||
            result.article !== 1 || result.alignment !== 'left' || result.brokenImages.length) {
          throw new Error(`${slug} at ${width}px: ${JSON.stringify(result)}`);
        }
        if ([375, 1440].includes(width) && ['as', 'pso', 'tombstoneanalysis', 'ue4lightmap'].includes(slug)) {
          await page.screenshot({ path: `layout-screenshots/${slug}-${width}.png`, fullPage: true });
        }
      }
      await page.goto('http://127.0.0.1:8765/archive/', { waitUntil: 'networkidle' });
      const archive = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        links: [...document.querySelectorAll('.archive-list a')].map(a => a.getAttribute('href')),
        dates: [...document.querySelectorAll('.archive-list time')].map(time => time.dateTime),
        missingYearTargets: [...document.querySelectorAll('.archive-years a')]
          .filter(a => !document.getElementById(a.hash.slice(1))).length,
      }));
      const expected = articles.map(entry => `/${entry.slug}/`).sort();
      if (archive.width > width + 1 || archive.missingYearTargets ||
          JSON.stringify(archive.links.slice().sort()) !== JSON.stringify(expected) ||
          archive.dates.some((date, index) => index && date > archive.dates[index - 1])) {
        throw new Error(`Archive at ${width}px: ${JSON.stringify(archive)}`);
      }
      if ([375, 1440].includes(width)) {
        await page.screenshot({ path: `layout-screenshots/archive-${width}.png`, fullPage: true, animations: 'disabled' });
      }
      for (const slug of ['', 'posts/']) {
        await page.goto(`http://127.0.0.1:8765/${slug}`, { waitUntil: 'networkidle' });
        if (!await page.locator('a[href="/archive/"]').count()) throw new Error(`Missing Archive entry on /${slug}`);
      }
      await page.close();
    }
    console.log(`${articles.length} articles and archive checked at 375, 768 and 1440px`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

