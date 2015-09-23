'use strict';

// Create class
function Tools() {
  this.output = null;
}

// Added methods
Tools.prototype = {
  setError: function(err) {
    console.error(err);
    process.exit(1);
  },
  setResponse: function(msg) {
    if(msg) {
      this.output(msg);
    }
    process.exit(0);
  },
  clone: function(srcInstance)
  {
    if (srcInstance === undefined || srcInstance === null){
      return null;
    }
    if(typeof srcInstance !== 'object') {
      return  srcInstance;
    }

    var newInstance = srcInstance.constructor();

    for (var i in srcInstance) {
      if(srcInstance[i] !== undefined) {
        newInstance[i] = this.clone(srcInstance[i]);
      }
    }

    return newInstance;
  }
};

module.exports = Tools;
