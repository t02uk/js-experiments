<template>
  <footer>
    <span class="poweredBy">
      powered by <a href="https://nuxtjs.org/">Nuxt.js</a></span
    >
  </footer>
</template>

<style>
footer {
  display: flex;
  align-items: center;
  width: 100%;
  background: #000;
  height: 3.5rem;

  position: sticky;
  top: 0;
}

.poweredBy {
  margin-left: 1rem;
  color: #fff;
  font-size: 80%;
}
</style>
