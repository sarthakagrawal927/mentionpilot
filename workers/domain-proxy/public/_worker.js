const STATIC_PATHS = new Set(["/robots.txt", "/sitemap.xml", "/llms.txt"]);

export default {
  fetch(request, env) {
    if (env.ASSETS && STATIC_PATHS.has(new URL(request.url).pathname)) {
      return env.ASSETS.fetch(request);
    }
    return env.WEB.fetch(request);
  },
};
