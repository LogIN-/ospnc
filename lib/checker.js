/* 
 * @Author: login
 * @Date:   2014-10-05 13:25:51
 * @Last Modified by:   login
 * @Last Modified time: 2014-10-20 10:38:40
 */

/*jslint node: true */
"use strict";


var request = require('request');
var _ = require('underscore');

var nameChecker = function(plugins, projectName, onItemCallback, onEndCallback) {
    // User Query string (project name)
    this.projectName = projectName;
    // CALLBACKS
    this.onItemCallback = onItemCallback;
    this.onEndCallback = onEndCallback;

    // Default plug-ins
    this.plugins = _.extend({
        github: {
            reqName: 'GitHub',
            reqHost: 'https://api.github.com',
            reqPath: '/search/repositories?q={projectNameQuery}&sort=stars&order=desc',
            checkType: 'variable',
            checkField: 'total_count'
        },
        npmjs: {
            reqName: 'npmjs',
            reqHost: 'https://api.npmjs.org',
            reqPath: '/downloads/range/last-day/{projectNameQuery}',
            checkType: 'variable',
            checkField: 'downloads'

        },
        sourceforge: {
            reqName: 'SourceForge',
            reqHost: 'http://sourceforge.net',
            reqPath: '/projects/{projectNameQuery}/',
            checkType: 'serverResponse',
            checkField: '404'
        },
        googlecode: {
            reqName: 'Google Code',
            reqHost: 'https://code.google.com',
            reqPath: '/p/{projectNameQuery}/feeds',
            checkType: 'serverResponse',
            checkField: '404'
        },
        // https://mr-travers.codeplex.com/documentation
        pypi: {
            reqName: 'PyPI',
            reqHost: 'https://pypi.python.org',
            reqPath: '/pypi/{projectNameQuery}/',
            checkType: 'serverResponse',
            checkField: '404'
        },
        rubygems: {
            reqName: 'RubyGems',
            reqHost: 'https://rubygems.org',
            reqPath: '/gems/{projectNameQuery}',
            checkType: 'serverResponse',
            checkField: '404'
        },
        debian: {
            reqName: 'debian',
            reqHost: 'http://sources.debian.net',
            reqPath: '/api/search/{projectNameQuery}/',
            checkType: 'variable',
            checkField: 'results',
        },        
        bitbucket: {
            reqName: 'bitbucket',
            reqHost: 'https://bitbucket.org',
            reqPath: '/repo/all?name={projectNameQuery}',
            checkType: 'text',
            checkFieldPre: 'Showing',
            checkField: /Showing (.*?) results /g
        }
    }, plugins);

    // Start request
    this.checkRequest();

};

nameChecker.prototype.checkRequest = function() {
    var self = this;
    var output,
        options,
        status,
        responsResoult;

    _.each(self.plugins, function(plugin) {

        options = null;
        // Project can be hosted on sub-domain
        if (plugin.reqPath.search(/projectNameQuery/) >= 0) {
            plugin.reqPath = plugin.reqPath.replace('{projectNameQuery}', self.projectName);
        } else {
            plugin.reqHost = plugin.reqHost.replace('{projectNameQuery}', self.projectName);
        }
        options = {
            url: plugin.reqHost + plugin.reqPath,
            headers: {
                'User-Agent': 'OSPNC <https://github.com/LogIN-/ospnc>'
            },
            timeout: 2000,
            strictSSL: false
        };
        request(options, function(error, response, body) {
            status = null;
            responsResoult = null;
            if (!error) {
                if (plugin.checkType === 'variable') {
                                    
                    try{
                        responsResoult = JSON.parse(body); 
                        if (responsResoult[plugin.checkField]) {
                            status = 'unavailable';
                        } else {
                            status = 'available';
                        }
                        if(plugin.reqName == 'debian'){
                            var total = responsResoult[plugin.checkField].other.length;
                            if(total && parseInt(total) > 0){
                                status = 'unavailable';
                            }else{
                                status = 'available';
                            }
                        }

                    } catch(e){
                        console.log(e);
                    }

                } else if (plugin.checkType === 'serverResponse') {

                    if (response.statusCode == parseInt(plugin.checkField)) {
                        status = 'available';
                    } else {
                        status = 'unavailable';
                    }

                } else if (plugin.checkType === 'text') {

                    if(new RegExp(plugin.checkFieldPre).test(body)) {
                        var match = plugin.checkField.exec(body);
                       
                        if(match !== null){
                            var matchRes = match[1];
                            if(matchRes){
                                if(plugin.reqName == 'bitbucket'){
                                    if(parseInt(matchRes) > 0){
                                        status = 'unavailable';
                                    }else{
                                        status = 'available';
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if(status === null) {
                status = 'unknown';
            }
            output = {
                name: plugin.reqName,
                namesafe: plugin.reqName.replace(/\s+/g, '-').toLowerCase(),
                host: plugin.reqHost + plugin.reqPath,
                status: status,
                headers: {
                    reqHost: plugin.reqHost,
                    reqPath: plugin.reqPath
                }
            };

            if (self.onItemCallback && typeof(self.onItemCallback) === "function") {
                self.onItemCallback(output);
            }

        });
    });

    if (self.onEndCallback && typeof(self.onEndCallback) === "function") {
        self.onEndCallback();
    }
};

module.exports = nameChecker;
