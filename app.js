#!/usr/bin/env node
'use strict';

// Dependencies
var program = require('commander');
var fs = require('fs');
var path = require('path');

// Config
var config = require('./config/config.js');

// Class
var PackageManger = require ('./lib/packageManager.js');
var Tools = require('./lib/tools.js');

// Init Class
var pm = new PackageManger();
var tools = new Tools();

// Init custom log
tools.output = tools.clone(console.log);

// Remove default npm console.log
console.log = function(){};

var packagesOutdated = function (packagesFiltered) {
  var packages = [];
  var projectName = '';
  if(packagesFiltered) {
    projectName = packagesFiltered.name;
    packages = Object.keys(packagesFiltered.dependencies);
  } else {
    projectName = pm.packages.name;
    packages = Object.keys(pm.packages.dependencies);
  }
  tools.output('Dependencies outdated:\n');
  var onlyPackagesInstalled = false;
  if(program.onlyPackagesInstalled) {
    onlyPackagesInstalled = true;
  }
  pm.outdated(packages, onlyPackagesInstalled, function(err, packagesVersion) {
    if(err) {
      tools.setError(err);
    } else {
      var msg = 'No update for project ' + projectName;
      if(Object.keys(packagesVersion).length > 0) {
        msg = '\nDependencies updated for project ' + projectName;
        tools.output(JSON.stringify(packagesVersion, null, 4));
      }
      if(program.upgrade) {
        pm.upgradePackage(packagesVersion, function(err){
          if(err) {
            tools.setError(err);
          } else {
            tools.setResponse(msg);
          }
        });
      } else if(program.exclude) {
        pm.revertPackage(function(err){
          if(err) {
            tools.setError(err);
          } else {
            tools.setResponse(msg);
          }
        });
      } else {
        tools.setResponse(msg);
      }
    }
  });
}

var analyzeProjectDependencies = function (pathFile, excludePackages) {
  pm.listPackage(pathFile, 'package.json',function(err, packages) {
    if(err) {
      tools.setError(err);
    } else {
      if(excludePackages) {
        pm.filter(packages, excludePackages, function(err, packagesFiltered) {
          if(err) {
            tools.setError(err);
          } else {
            packagesOutdated(packagesFiltered);
          }
        });
      } else {
        packagesOutdated();
      }
    }
  });
}

program
  .version('0.0.1')
  .usage('<package.json or dir> [options]')
  .option('-u, --upgrade', 'upgrade package.json dependencies to match latest versions (maintaining existing policy)')
  .option('-e, --exclude [path]', 'exclude some packages. param is a path to excludePackage.json')
  .option('-p, --prefix [path]', 'specify the directory of node_modules')
  .option('--onlyPackagesInstalled', 'check only the packages existing in node_modules')
  .parse(process.argv);

var pathFile = program.args[0];
if(pathFile === undefined) {
  pm.projectPath = './';
} else {
  if(fs.existsSync(pathFile) && fs.statSync(pathFile).isDirectory()) {
    pm.projectPath = pathFile;
    config.prefix = path.join(pathFile, 'node_modules');
  }
}

if(program.prefix) {
  pm.existingFile(program.prefix,'', function(err, pathNodeModules) {
    if(err) {
      tools.setError(err);
    } else {
      config.prefix = pathNodeModules;
    }
  });
}

pm.config(config, function(err, pm) {
  if(err) {
    tools.setError(err);
  } else {
    if(program.exclude) {
      pm.listPackage(program.exclude, 'excludePackage.json',function(err, excludePackages) {
        if(err) {
          tools.setError(err);
        } else {
          analyzeProjectDependencies(pathFile, excludePackages);
        }
      });
    } else {
      analyzeProjectDependencies(pathFile);
    }
  }
});