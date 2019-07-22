<template>
  <footer>
    <span class="powered-by">
      powered by <a href="https://nuxtjs.org/">Nuxt.js</a></span
    >
  </footer>
</template>

<style scoped>
footer {
  display: flex;
  align-items: center;
  width: 100%;
  background: #000;
  height: 3.5rem;

  position: sticky;
  top: 0;
}

.powered-by {
  margin-left: 1rem;
  color: #fff;
  font-size: 80%;
}
</style>
