const FirecrawlApp = require('@mendable/firecrawl-js').default;
const app = new FirecrawlApp({ apiKey: "fc-f7a8767212e545d8b9bc168598a5901a" });
app.search("น้ำท่วม").then(res => console.log(JSON.stringify(res, null, 2))).catch(err => console.error(err));
