// Setup basic express and socket.io server
var server = {};
server.express = require('express');
server.mainApp = server.express(),
server.mainServer = require('http').createServer(server.mainApp),
server.io = require('socket.io')(server.mainServer);

// Some configs and handlers
var config = {
    port: 8089,
    clients: [],
    client_id: null,
    queue_count: 0
};

/* Application wrapper */
var ospnc = {};
// Main NameChecker scrapper class
ospnc.NameChecker = require('./lib/checker');
ospnc.func = require('./lib/functions');

// Start server on port
server.mainServer.listen(config.port, function () {
  console.log('Server listening at port %d', config.port);
});

// Routing for static fronted files
server.mainApp.use(server.express.static(__dirname + '/public'));

server.io.sockets.on('connection', function (socket) {

    // Register for private session
    socket.on("register", function(data) {
        // Create new Client
        var clientId = data.guid;
        
        config.clients[clientId] = {};
        config.clients[clientId].socket = socket;
        config.clients[clientId].requests_count = 0;

        // User just opened our page lets give him unique ID and tell him that
        config.clients[clientId].socket.emit('welcome', {message:  'Welcome', guid: clientId });
        // hmm.. another one is here Jupi!, lets notify everybody
        socket.broadcast.emit('system', { message: 'Another user registered on system: ' + clientId});

    });

    socket.on('process', function (data) {
        // Create new Client
        var clientId = data.guid;
        var clientSearch = data.clientSearch;

        config.clients[clientId].requests_count += 1;
        config.clients[clientId].debug_count = 0;  

        config.queue_count += 1;        
        config.clients[clientId].socket.emit('system', { message: 'Your request "' + config.clients[clientId].requests_count + '" is ' + config.queue_count + ' in queue!'}); 
        
        /* Check for availability */    
        new ospnc.NameChecker({}, clientSearch, function(response) {     
            config.clients[clientId].socket.emit('console_output', { data: response, guid:  clientId});
        });

    });

});

