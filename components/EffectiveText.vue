<template>
  <canvas class="effective-text" width="350px" height="20px" />
</template>

<style scoped>
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
      this.startedAt = +new Date()
    }
  },
  mounted() {
    const self = this
    this.ctx = this.$el.getContext('2d')

    function draw() {
      const ctx = self.ctx
      const width = self.$el.width
      const height = self.$el.height
      const elapsed = new Date() - self.startedAt
      const x = (elapsed / 6) % (width * 5)

      ctx.beginPath()
      ctx.fillStyle = 'rgb(0, 0, 0)'
      ctx.fillRect(0, 0, width, height)
      ctx.fill()

      ctx.font = '12px monospace'
      ctx.textBaseline = 'top'
      ctx.fillStyle = 'rgb(255, 255, 255)'
      ctx.fillText(self.text, 0, 0)

      ctx.drawImage(self.$el, x, 0, 1, height, x, 0, width - x, height)

      requestAnimationFrame(draw)
    }
    draw()
  }
}
</script>
