export const state = () => ({
  path: ''
})

export const mutations = {
  changePath(state, path) {
    state.path = path
  }
}
