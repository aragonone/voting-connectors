// See https://stackoverflow.com/a/1527820
// Modified to not be inclusive at the end range
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

module.exports = {
  getRandomInt,
}
