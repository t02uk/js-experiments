<template>
  <div id="container">
    <x-header />
    <main class="content">
      <div class="frame" v-bind:style="frameStyle">
        <iframe
          v-bind:src="$store.state.menu.path"
          style="width: 100%; height: 100%"
          scrolling="no"
          frameborder="no"
        />
      </div>
    </main>
    <x-footer>b</x-footer>
  </div>
</template>

<style>
#__nuxt,
#__layout,
#container {
  height: 100%;
}

html {
  height: 100%;
}

body {
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
      path: '1h6X'
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
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>
