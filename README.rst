*******************************
Npm dependencies manager
*******************************

Introduction
============
Npm dependencies manager check if an update is available for the dependencies write in the package.json

Example
=======

app.js <package.json or directory> [options]

List of options
---------------

* ``-u (or --upgrade)``
    upgrade package.json dependencies to match latest versions (maintaining existing policy)

* ``-e (or --exclude) [path]``
    exclude some packages. in parameters you can write the explicit path of excludePackages.json file or the directory of package.json will be used.

* ``-p (or --prefix) [path]``
    specify the directory of node_modules

* ``--onlyPackagesInstalled``
    check only the packages existing in node_modules directory