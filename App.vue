<script>
export default {
  onLaunch() {
    console.log('App launched')
    // #ifdef APP-PLUS
    plus.screen.lockOrientation('portrait')
    // #endif
  }
}
</script>

<style>
page {
  background-color: #0f0f23;
  color: #e0e0e0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
