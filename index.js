/*jslint indent: 4, maxlen: 80, node: true */
(function () {
    'use strict';

    var // Classes
        DependencyUpdater,

        // Functions
        handleFile,

        // Requires
        fs = require('fs'),
        exec = require('child_process').exec;

    DependencyUpdater = function () {
        var // Functions
            updateDependency,
            installDependency,
            addDependency,
            updateNext,

            // Variables
            self = {},
            dependencies = [];

        updateDependency = function (dep, cb) {
            var command = 'bower install ' + dep.name + ' --force-latest --save';

            if (dep.dev) {
                command += '-dev';
            }

            var start = Date.now();
            exec(command, function callback(err) {
                if (err) {
                    if ((Date.now() - start) < 15000) {
                        return exec(command, callback);
                    }
                    console.log('✘ Error updating ' + dep.name + ' - ' + err);
                } else {
                    console.log('✔ ' + dep.name);
                }

                cb();
            });
        };

        installDependency = function (name, version) {
            var command,
                depName;

            // any version?
            if (version === '*') {
                depName = name;
            } else {
                depName = name + '@' + version
            }
            command = 'bower install ' + depName;

            var start = Date.now();
            exec(command, function callback(err) {
                if (err) {
                    if ((Date.now() - start) < 15000) {
                        return exec(command, callback);
                    }
                    console.log('✘ Error installing ' + depName + ' - ' + err);
                } else {
                    if (version === '*') {
                        console.log('✔ ' + depName + ' (any version)');
                    } else {
                        console.log('✔ ' + depName + ' (exact version)');
                    }
                }
            });
        };

        addDependency = function (name, dev) {
            dependencies.push({
                name: name,
                dev: !!dev
            });
        };

        updateNext = function () {
            if (dependencies.length) {
                updateDependency(
                    dependencies.shift(),
                    updateNext
                );
            } else {
                console.log('➤ All dependencies updated!');
            }
        };

        self.addDependency = addDependency;
        self.installDependency = installDependency;
        self.updateNext = updateNext;

        return self;
    };

    handleFile = function (err, data) {
        if (err) {
            console.log('✘ Problem getting your file, please try again.');
            return;
        }

        console.log('➤ Getting and parsing bower.json file...');

        var bowerJson = JSON.parse(data),
            updater = new DependencyUpdater(),
            regex = /\^|~|<|>|\|/;

        if (bowerJson.dependencies) {
            Object
                .entries(bowerJson.dependencies)
                .forEach(function (entry) {
                    // exact version?
                    if (regex.test(entry[1])) {
                        updater.addDependency(entry[0]);
                    } else {
                        updater.installDependency(entry[0], entry[1]);
                    }
                });
        }

        if (bowerJson.devDependencies) {
            Object
                .keys(bowerJson.devDependencies)
                .forEach(function (dep) {
                    updater.addDependency(dep, true);
                });
        }

        updater.updateNext();
    };

    fs.readFile('bower.json', 'utf-8', handleFile);
}());
