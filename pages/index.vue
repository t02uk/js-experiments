<template>
  <div id="container">
    <x-header />
    <main class="content">
      <div>
        <div class="content--tip">
          <div class="source-code">
            <a
              v-bind:href="sourceCodeHref"
              class="source-code--anchor"
              target="_blank"
            >
              <img src="images/code.png" class="source-code--icon" />
              code
            </a>
          </div>
        </div>
        <div class="frame" v-bind:style="frameStyle">
          <iframe
            v-bind:src="iframeSrc"
            style="width: 100%; height: 100%"
            scrolling="no"
            frameborder="no"
          />
        </div>
      </div>
    </main>
    <x-footer />
  </div>
</template>

<style scoped>
#container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content {
  flex-grow: 1;
  height: 100%;
  width: 100%;

  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.frame {
  border: solid 1px #ddd;
}

.source-code {
  margin-left: 4px;
  font-size: 0.8rem;
  width: 100%;
}

.source-code--anchor,
.source-code--anchor:visited {
  color: #cc0064;
  text-decoration: none;
}

.source-code--icon {
  margin-bottom: -0px;
  height: 1rem;
  width: 1rem;
}
</style>

<script>
import XHeader from '~/components/XHeader.vue'
import XFooter from '~/components/XFooter.vue'

export default {
  components: {
    XHeader,
    XFooter
  },
  data: () => {
    return {
      frameStyle: {
        width: '320px',
        height: '320px'
      },
      path: ''
    }
  },
  methods: {
    handleResize() {
      const content = document.getElementsByClassName('content')[0]
      const width = `${content.clientHeight - 56}px`
      this.frameStyle = {
        width: width,
        height: width
      }
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)
    this.handleResize()
    this.$store.watch(
      (state, getters) => getters['menu/path'],
      (newValue, oldValue) => {
        const iframe = document.getElementsByTagName('iframe')[0]
        iframe.focus()
      }
    )
  },
  computed: {
    iframeSrc() {
      const path = this.$store.state.menu.path
      if (!path) {
        return ''
      }
      return `frame/launcher.html?path=${path}`
    },
    sourceCodeHref() {
      const path = this.$store.state.menu.path
      if (!path) {
        return '#'
      }
      return `https://github.com/t02uk/js-experiments/tree/master/static/frame/${path}`
    }
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>
