<template>
  <div id="app">
    <form v-on:submit.prevent="onSubmit" class='search-box'>
      <span @click.prevent='forwardFocus'>Graph for</span>
      <query-input class='query-input' placeholder='Enter query' v-model='appState.query' :pattern='appState.pattern' ref='queryInput'></query-input>
      <a type='submit' class='search-submit' href='#' @click.prevent='onSubmit' v-if='appState.query'>Go</a>
    </form>
    <div class='help' v-if='!isLoading'>
      The graph was made from Google's auto-complete.
      <a href='#' @click.prevent='aboutVisible = true' class='highlight'>Learn more.</a>
    </div>
    <div class='help' v-if='isLoading'>{{appState.progress.message}}</div>
    <div class='about-line'>
      <a class='about-link' href='#' @click.prevent='aboutVisible = true'>about</a>
      <a class='bold' href='http://github.com/anvaka/vs'>source code</a>
    </div>

    <about v-if='aboutVisible' @close='aboutVisible = false'></about>

    <div class='welcome' v-if='!appState.hasGraph'>
      <h3>Welcome!</h3>
      <p>This website renders graph of Google's auto-complete.
      <a class='highlight' href='#' @click.prevent='aboutVisible = true'>Click here</a> to learn more, or <a class='highlight' href='?query=iphone'>try demo</a>.
         </p>
    </div>

    <div class='tooltip' ref='tooltip'>{{tooltip.text}}</div>

  </div>
</template>

<script>
import appState, {performSearch, resolveQueryFromLink} from './appState.js';
import createRenderer from './lib/createRenderer';
import About from './components/About';
import QueryInput from './module/QueryInput';
import bus from './bus'

export default {
  name: 'App',
  data() {
    return {
      aboutVisible: false,
      appState,
      tooltip: {
        text: '',
        x: '',
        y: ''
      }
    };
  },
  components: {
    About,
    QueryInput
  },
  computed: {
    isLoading() {
      return appState.progress.working;
    },
  },
  methods: {
    forwardFocus() {
      this.$refs.queryInput.focus();
    },
    onSubmit() {
      if (!appState.query) return;

      performSearch(appState.query)
      this.renderer.render(appState.graph);
      const el = document.querySelector( ':focus' );
      if(el) el.blur();
    },

    showTooltip(event) {
      const el = this.$refs.tooltip;
      if (event.isVisible) {
        el.classList.add('visible');
        el.innerText = resolveQueryFromLink(event.from, event.to);
        el.style.left = (event.x + 16) + 'px';
        el.style.top = (event.y - 16) + 'px';
      } else {
        el.classList.remove('visible');
      }
    },

    showDetails(link) {
      const query = resolveQueryFromLink(link.fromId, link.toId);
      window.open('https://google.com/search?q=' + encodeURIComponent(query), '_blank');
    }
  },
  mounted() {
    this.renderer = createRenderer(appState.progress);
    bus.on('show-tooltip', this.showTooltip, this);
    bus.on('show-details', this.showDetails, this);
    if (appState.graph) {
      this.renderer.render(appState.graph);
    }
  },
  beforeDestroy() {
    bus.off('show-tooltip', this.showTooltip, this);
    bus.off('show-details', this.showDetails, this);
  }

}
</script>

<style lang='stylus'>
@import('./vars.styl');

#app {
  position: relative;
  margin: 8px 14px;
  width: 392px;
  background: background-color;
}

.query-input {
  flex: 1;
  margin-left: 8px;
}

.highlight {
  color: highlight-color;
}

rect, path, text {
  transition: stroke 200ms, fill 200ms;
}

.hovered rect,
path.hovered {
  stroke: highlight-color;
}

.hovered rect {
  stroke: highlight-color;
}

.help {
  font-size: 12px;
  margin-top: 8px;
  a {
    background: background-color;
  }
}
a {
  &:hover, &:focus {
    color: highlight-color;
    border-bottom: 1px dashed;
  }
}
.search-submit {
  align-items: center;
  text-decoration: none;
  display: flex;
  flex-shrink: 0;
  width: 48px;
  justify-content: center;
  outline: none;
  &:hover, &:focus {
    color: background-color;
    background: highlight-color;
  }
}
.special {
  color: highlight-color;
  font-family: monospace;
}
a {
  text-decoration: none;
}

.about-line {
  position: fixed;
  right: 0;
  top: 8px;
  padding: 0px 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;

  a {
    text-align: right;
    background: background-color;
    font-size: 12px;
    padding: 0 8px;
    line-height: 24px;
    height: 24px;
    color: secondary-color;
    border-bottom: 1px solid transparent;
    &:hover, &:focus {
      color: highlight-color;
      border-bottom: 1px dashed;
    }
  }
}

.tooltip {
  box-shadow: 0 2px 4px rgba(0,0,0,0.2), 0 -1px 0px rgba(0,0,0,0.02);
  position: fixed;
  background: background-color;
  padding: 8px;
  border: 1px solid border-color;
  pointer-events: none;
  opacity: 0;
  transition-duration: 300ms;
  transition-property: opacity;
}
.tooltip.visible {
  opacity: 1;
}

.search-box {
  position: relative;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2), 0 -1px 0px rgba(0,0,0,0.02);
  height: 48px;
  display: flex;
  font-size: 16px;
  padding: 0 0 0 8px;
  cursor: text;

  a {
    color: #B2B2B2
    cursor: pointer;
  }
  span {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

}


@media (max-width: 800px) {
  #app {
    width: 100%;
    margin: 0;
  }
  .welcome {
    padding: 16px;
  }
  .help {
    padding: 0 8px;
  }
  .about-line {
    bottom: 0;
    top: initial;
    right: 0;
  }
}

@media (max-height: 550px) {
  .search-box {
    height: 32px;
    input.search-input {
      font-size: 16px;
    }

  }
  .help {
    margin-top: 4px;
  }
}
</style>
