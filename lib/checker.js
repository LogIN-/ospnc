/* 
 * @Author: login
 * @Date:   2014-10-05 13:25:51
 * @Last Modified by:   login
 * @Last Modified time: 2014-10-06 13:24:45
 */

/*jslint node: true */
"use strict";


var request = require('request');
var _ = require('underscore');

var nameChecker = function(plugins, projectName, callback) {

    // Check results container
    this.results = [];
    this.resultsCounter = 0;
    this.projectName = projectName;
    this.callback = callback;

    // Default plugins
    this.plugins = _.extend({
        github: {
            resType: 'json',
            reqName: 'GitHub',
            reqHost: 'https://api.github.com',
            reqPath: '/search/repositories?q={parojectNameQuery}&sort=stars&order=desc',
            reqMethod: 'POST',
            checkType: 'variable',
            checkField: 'total_count'
        },
        npmjs: {
            resType: 'json',
            reqName: 'npmjs',
            reqHost: 'https://api.npmjs.org',
            reqPath: '/downloads/range/last-day/{parojectNameQuery}',
            reqMethod: 'POST',
            checkType: 'variable',
            checkField: 'downloads'

        },
        sourceforge: {
            resType: 'json',
            reqName: 'sourceforge',
            reqHost: 'https://sourceforge.net',
            reqPath: '/rest/p/{parojectNameQuery}',
            reqMethod: 'POST',
            checkType: 'serverResonse',
            checkField: '404'
        }
    }, plugins);

    // Start request
    this.checkRequest();

};

nameChecker.prototype.checkRequest = function() {
    var self = this;
    var output;
    var options;

    _.each(self.plugins, function(plugin) {

        plugin.reqPath = plugin.reqPath.replace('{parojectNameQuery}', self.projectName);

        options = {
            url: plugin.reqHost + plugin.reqPath,
            headers: {
                'User-Agent': 'request'
            }
        };
        request(options, function(error, response, body) {
            if (!error) {

                if (plugin.checkType == 'variable') {
                    var responsResoult = JSON.parse(body);
                    var status;

                    if (responsResoult[plugin.checkField]) {
                        status = 'unavailable';
                    } else {
                        status = 'available';
                    }
                    output = {
                        name: plugin.reqName,
                        host: plugin.reqHost + plugin.reqPath,
                        status: status
                    };
                    self.results.push(output);

                } else if (plugin.checkType == 'serverResonse') {

                    if (response.statusCode == parseInt(plugin.checkField)) {
                        output = {
                            name: plugin.reqName,
                            host: plugin.reqHost + plugin.reqPath,
                            status: 'available'
                        }
                        self.results.push(output);

                    } else {
                        output = { 
                            name: plugin.reqName,
                            host: plugin.reqHost + plugin.reqPath,
                            status: 'unavailable'
                        };
                        self.results.push(output);
                    }
                }
            } else {
                output = {
                    name: plugin.reqName,
                    host: plugin.reqHost,
                    status: responsResoult[plugin.checkField] || 'unavailable'
                };
                self.results.push(output);
            }
            self.resultsCounter++;

            if (self.callback && typeof(self.callback) === "function") {
                self.callback(output);
            }

        });
    });
};

// new nameChecker({}, 'nativeMinify', function(response) {
//     console.log("RESPONSE");
//     console.log(response);
//     console.log("----------");
// });

module.exports = nameChecker;
