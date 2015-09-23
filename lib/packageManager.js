'use strict';

// Dependencies
var fs = require('fs');
var path = require('path');
var npm = require('npm');
var async = require('async');
var jf = require('jsonfile');
var Tools = require('./tools.js');

//Init tools
var tools = new Tools();

// Create class
function PackageManager() {
  this.npm = null;
  this.packageFile = null;
  this.packages = null;
  this.excludePackageFile = null;
  this.excludePackages = null;
  this.projectPath = null;
}

// Added methods
PackageManager.prototype = {
  config: function(config, callback) {
    var self = this;
    npm.load(config, function(err, npm) {
      if(err) {
        callback(err, null);
      } else {
        self.npm = npm;
        callback(err, self);
      }
    });
  },
  listPackage: function(pathFile, jsonFile, callback) {
    var self = this;
    if(typeof pathFile !== 'string' && this.projectPath !== null) {
      pathFile = this.projectPath;
    }
    self.existingFile(pathFile, jsonFile, function(err, packageFile) {
      if(err) {
        callback(err);
      } else {
        jf.readFile(packageFile, function (err, packages) {
          if (err) {
            callback(err, null);
          } else {
            if(jsonFile === 'package.json') {
              self.packageFile = tools.clone(packageFile);
              self.packages = tools.clone(packages);
            } else {
              self.excludePackageFile = tools.clone(packageFile);
              self.excludePackages = tools.clone(packages);
            }
            callback(null, packages);
          }
        });
      }
    });
  },
  existingFile: function (pathFile, searchFile, callback) {
    var packageFile = null;
    if(fs.existsSync(pathFile)) {
      if(fs.statSync(pathFile).isDirectory()) {
        packageFile = path.join(pathFile, searchFile);
      } else {
        if (path.basename(pathFile) === searchFile) {
          packageFile = pathFile;
        }
      }
      if (!fs.existsSync(packageFile)) {
        callback(searchFile + ' not found', null);
      } else {
        callback(null, packageFile);
      }
    } else {
      callback(pathFile + ' is not a valid file or directory', null);
    }
  },
  outdated: function(packages, onlyPackagesInstalled, callback) {
    var self = this;
    var packagesVersion = {};
    self.npm.commands.outdated(packages, function (err, modules) {
      if(err) {
        callback(err, null);
      } else {
        async.each(modules, function (item, cb) {
          // Format item:
          // 0 : project path
          // 1 : name module
          // 2 : current version installed
          // 3 : wanted version
          // 4 : latest version
          // 5 : package.json version

          var check = true;
          if(item[2] === undefined) {
            if(onlyPackagesInstalled === true) {
              check = false;
            }
          }

          if(check === true) {
            if(self.excludePackages !== null &&
              self.excludePackages.maxVersion[item[1]]) {
              if(item[2] !== item[3]) {
                packagesVersion[item[1]] = {
                  packageVersion: item[2],
                  wantedVersion: item[3]
                };
              }
            } else {
              packagesVersion[item[1]] = {
                packageVersion: item[2],
                wantedVersion: item[4]
              };
            }
          }
          cb();
        }, function(err) {
          if(err) {
            callback(err, null);
          } else {
            callback(null, packagesVersion);
          }
        });
      }
    });
  },
  filter: function(packages, excludePackages, callback) {
    var self = this;
    self.backupPackage(function(err) {
      if(err) {
        callback(err, null);
      } else {
        var dependencies = packages.dependencies;
        var excludePackage = excludePackages.exclude;
        var fixPackageVersion = excludePackages.maxVersion;

        excludePackage.forEach(function(packageName) {
          delete dependencies[packageName];
        });
        Object.keys(fixPackageVersion).forEach(function(packageName) {
          dependencies[packageName] = fixPackageVersion[packageName];
        });

        packages.dependencies = dependencies;
        self.writeJson(self.packageFile, packages, function(err) {
          if(err) {
            callback(err, null);
          } else {
            callback(null, packages);
          }
        });
      }
    });
  },
  writeJson: function(file, json, callback) {
    jf.writeFile(file, json, {spaces: 2}, function(err) {
      callback(err);
    });
  },
  backupPackage: function(callback) {
    var self = this;
    self.writeJson(self.packageFile + '.backup', self.packages, function(err) {
      callback(err);
    });
  },
  upgradePackage: function(packagesVersion, callback) {
    var self = this;
    self.backupPackage(function(err) {
      if(err) {
        callback(err, null);
      } else {
        Object.keys(packagesVersion).forEach(function(packageName) {
          self.packages.dependencies[packageName] = packagesVersion[packageName].wantedVersion;
        });
        self.writeJson(self.packageFile, self.packages, function(err) {
          callback(err);
        });
      }
    });
  },
  revertPackage: function(callback) {
    var self = this;
    self.writeJson(self.packageFile, self.packages, function(err) {
      callback(err);
    });
  }
};

module.exports = PackageManager;
