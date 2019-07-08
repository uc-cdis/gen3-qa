/* Helper functions to facilitate complex comparisons */

function arraysEqual(a, b) {
  // order of elements matters
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;  
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

module.exports = {
  objectsAreEquivalent(a, b) {
    // http://adripofjavascript.com/blog/drips/object-equality-in-javascript.html
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);
    if (aProps.length != bProps.length) {
        return false;
    }
    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];
        if (Array.isArray(a[propName]) && !arraysEqual(a, b)) {
          return false;
        }

        if (!Array.isArray(a[propName]) && a[propName] !== b[propName]) {
          return false;
        }
    }
    return true;
  }
};