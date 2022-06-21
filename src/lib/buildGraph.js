import bus from "../bus";
import { apiClient } from "../module/api";

/**
 * This function builds a graph from google's auto-suggestions.
 */
export default function buildGraph(entryWord, MAX_DEPTH, progress) {
  console.log(
    "🚀 buildGraph: entryWord, MAX_DEPTH, progress",
    entryWord,
    MAX_DEPTH,
    progress
  );
  entryWord = entryWord && entryWord.trim();
  if (!entryWord) return;

  entryWord = entryWord.toLocaleLowerCase();

  let cancelled = false;
  let pendingResponse;
  let graph = require("ngraph.graph")();
  graph.maxDepth = MAX_DEPTH;
  let queue = [];
  let requestDelay = 300 + Math.random() * 100;
  progress.startDownload();

  startQueryConstruction();

  return {
    dispose,
    graph
  };

  function dispose() {
    cancelled = true;
    if (pendingResponse) {
      // TODO: uncomment this and stick with cancelable promises
      // pendingResponse.cancel();
      pendingResponse = null;
    }
  }

  function startQueryConstruction() {
    graph.addNode(entryWord, { depth: 0 });
    fetchNext(entryWord);
  }

  function loadSiblings(parent, results) {
    console.log("🚀 loadSiblings: parent, results", parent, results);
    // let q = fullQuery(parent).toLocaleLowerCase();
    var parentNode = graph.getNode(parent);

    if (!parentNode) {
      throw new Error("Parent is missing for " + parent);
    }

    // moved to getResponse()
    // .filter(x => x.toLocaleLowerCase().indexOf(q) === 0)
    // .map(x => x.substring(q.length))
    results.forEach(other => {
      const hasOtherNode = graph.hasNode(other);
      const hasOtherLink =
        graph.getLink(other, parent) || graph.getLink(parent, other);
      if (hasOtherNode) {
        if (!hasOtherLink) {
          graph.addLink(parent, other);
        }
        return;
      }

      let depth = parentNode.data.depth + 1;
      graph.addNode(other, { depth });
      graph.addLink(parent, other);
      if (depth < MAX_DEPTH) queue.push(other);
    });

    setTimeout(loadNext, requestDelay);
  }

  function loadNext() {
    if (cancelled) return;
    if (queue.length === 0) {
      bus.fire("graph-ready", graph);
      return;
    }

    let nextWord = queue.shift();
    fetchNext(nextWord);
    progress.updateLayout(queue.length, nextWord);
  }

  function fetchNext(query) {
    pendingResponse = apiClient.getResponse(query);
    pendingResponse
      .then(res => onPendingReady(res, query))
      .catch(msg => {
        const err = "Failed to download " + query + "; Message: " + msg;
        console.error(err);
        progress.downloadError(err);
        loadNext();
      });
  }

  function onPendingReady(res, query) {
    if (res.length === 0) {
      console.warn("[onPendingReady] Got empty [] result! query:", query);
      throw Error("got empty result []!");
    }

    // loadSiblings(query, res[1]);
    loadSiblings(query, res);

    // } else {
    //   console.error(res);
    //   throw new Error("Unexpected response");
    // }
  }
}
