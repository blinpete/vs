/**
 * API client.
 *
 * For buildGraph() to send requests and get siblings data.
 */

import jsonpFetch from "../lib/jsonpFetch";

export const apiClient = {
  pattern: null,

  fullQuery(query) {
    return this.pattern.replace("[query]", query).replace("...", "");
  },

  async getResponse(query) {
    const res = await jsonpFetch(
      "https://suggestqueries.google.com/complete/search?client=firefox&q=" +
        encodeURIComponent(this.fullQuery(query))
    );

    const q = this.fullQuery(query).toLocaleLowerCase();

    console.log("[getResponse] res:", res);

    if (res.length < 2) {
      console.error(res);
      throw new Error("[api] Unexpected response");
    }

    const filtered = res[1]
      .filter(x => x.toLocaleLowerCase().indexOf(q) === 0)
      .map(x => x.substring(q.length));

    console.log("[getResponse] q:", q);
    console.log("[getResponse] filtered:", filtered);

    return filtered;
  },

  checkPattern(pattern) {
    const insertPosition = pattern.indexOf("...");
    if (insertPosition < 0) {
      throw new Error('Query pattern is missing "..."');
    }
    const queryPosition = pattern.indexOf("[query]");
    if (queryPosition < 0) {
      throw new Error('Query pattern is missing "[query]" keyword');
    }

    if (insertPosition < queryPosition) {
      throw new Error("[query] should come before ...");
    }
  },

  setPattern(pattern) {
    this.pattern = pattern;
  }
};
