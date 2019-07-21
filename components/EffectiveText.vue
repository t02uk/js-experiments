<template>
  <canvas class="effective-text" width="300px" height="20px" />
</template>

<style>
.effective-text {
  background: #fff;
}
</style>

<script>
export default {
  props: {
    text: {
      type: String,
      default: ''
    }
  },
  watch: {
    text() {
      this.counter = 0
    }
  },
  mounted() {
    const self = this
    this.ctx = this.$el.getContext('2d')
    this.intervalId = setInterval(function() {
      const ctx = self.ctx
      const width = self.$el.width
      const height = self.$el.height
      const x = self.counter++ * 3

      ctx.beginPath()
      ctx.fillStyle = 'rgb(0, 0, 0)'
      ctx.fillRect(0, 0, width, height)
      ctx.fill()
      ctx.font = '12px monospace'
      ctx.textBaseline = 'top'
      ctx.fillStyle = 'rgb(255, 255, 255)'
      ctx.fillText(self.text, 0, 0)
      ctx.drawImage(self.$el, x, 0, 1, height, x, 0, width - x, height)
    }, 33)
  },
  beforeDestroy() {
    clearInterval(this.intervalId)
  }
}
</script>
