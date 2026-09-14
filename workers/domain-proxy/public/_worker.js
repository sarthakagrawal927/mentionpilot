export default {
  fetch(request, env) {
    return env.WEB.fetch(request);
  },
};
