const HTML = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<meta name=\"description\" content=\"Penantumbra Studio. Website in progress.\">\n<title>Penantumbra Studio</title>\n<link rel=\"canonical\" href=\"https://penantumbra.com/\">\n<style>\nhtml { color-scheme:light; background:#fffbfb; color:#171717; font:18px/1.6 Georgia,\"Times New Roman\",serif; }\nbody { max-width:44rem; margin:15vh auto; padding:0 1.5rem; }\nh1 { font-size:clamp(2rem,6vw,3.5rem); line-height:1.1; font-weight:normal; }\np { max-width:32rem; }\na { color:#0000ee; }\na:visited { color:#551a8b; }\na:focus-visible { outline:2px solid currentColor; outline-offset:4px; }\nfooter { margin-top:3rem; font-size:.9rem; }\n</style>\n</head>\n<body>\n<main>\n<h1>Penantumbra Studio</h1>\n<p>Website in progress.</p>\n<p>Technical notes and ideas are published on the <a href=\"https://penantumbra.github.io/\">tech blog</a>.</p>\n</main>\n<footer>penantumbra.com</footer>\n</body>\n</html>\n";

export default {
  fetch(request) {
    const headers = {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"
    };
    if (!["GET", "HEAD"].includes(request.method)) {
      return new Response("Method not allowed", { status: 405, headers: { "Allow": "GET, HEAD" } });
    }
    const pathname = new URL(request.url).pathname;
    if (pathname === "/favicon.ico") return new Response(null, { status: 204 });
    const found = pathname === "/" || pathname === "/index.html";
    return new Response(request.method === "HEAD" ? null : (found ? HTML : "Page not found"), {
      status: found ? 200 : 404,
      headers
    });
  }
};
