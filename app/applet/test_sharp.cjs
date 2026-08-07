try {
  require('sharp');
  console.log('Sharp is working');
} catch (e) {
  console.error('Sharp is not working:', e);
}
