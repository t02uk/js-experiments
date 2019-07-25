<template>
  <footer>
    <span class="powered-by">
      powered by <a href="https://nuxtjs.org/">Nuxt.js</a>
    </span>
    <span class="source-code">
      Source code of this page is available
      <a href="https://github.com/t02uk/js-experiments">
        on GitHub
      </a>
      .
    </span>
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

  color: #fff;
  font-size: 80%;
}

.powered-by,
.source-code {
  margin-left: 1rem;
}

footer a:visited {
  color: #8ba5ff;
}
</style>
