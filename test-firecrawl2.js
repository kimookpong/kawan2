const FirecrawlApp = require('@mendable/firecrawl-js').default;
const app = new FirecrawlApp({ apiKey: "fc-f7a8767212e545d8b9bc168598a5901a" });
app.scrapeUrl("https://th.wikipedia.org/wiki/%E0%B8%99%E0%B9%89%E0%B8%B3%E0%B8%97%E0%B9%88%E0%B8%A7%E0%B8%A1", {formats: ['markdown']}).then(res => console.log(JSON.stringify(res, null, 2).slice(0, 500))).catch(err => console.error(err));
