<template>
  <div id="container">
    <x-header />
    <main class="content">
      <div class="frame" v-bind:style="frameStyle">
        <iframe
          v-bind:src="iframeSrc"
          style="width: 100%; height: 100%"
          scrolling="no"
          frameborder="no"
        />
      </div>
    </main>
    <x-footer />
  </div>
</template>

<style>
#container {
  height: 100%;
}

#container {
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
}

.frame {
  border: solid 1px #ddd;
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
      const width = `${content.clientHeight - 40}px`
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
        this.path = newValue
        const iframe = document.getElementsByTagName('iframe')[0]
        iframe.focus()
      }
    )
  },
  computed: {
    iframeSrc() {
      return `frame/launcher.html?path=${this.path}`
    }
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>
