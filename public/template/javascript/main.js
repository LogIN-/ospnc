var socket = io.connect('http://localhost:8089');

var client = {
    guid: null,
    searches: [],
    counter: 0
};

var ospnc = {};

ospnc.generateUUID = function() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
    });
    return uuid;
};

ospnc.registerUser = function() {
    if(client.guid == null){
        client.guid = ospnc.generateUUID();
        console.log("generated new client:" + client.guid)
    }    
    // Register Client
    socket.emit('register', {
        'guid': client.guid
    });
};
ospnc.setupSocketEvents = function() {
    socket.on('welcome', function(data) {
        client.guid = escape(data.guid);
        console.log("User " + client.guid + " is registered!");
    });

    socket.on('console_output', function(data) {     
        var resJson = data.data; 

        var resHuman = {
            icon: null,
            title: null,
            favicon: 'template/images/favicons/' + resJson.namesafe + "_16x16.png"
        }

        if(resJson.status === 'available'){
            resHuman.icon = 'fa-smile-o';
            resHuman.title = 'Name is available!';
        }else if(resJson.status === 'unavailable'){
            resHuman.icon = 'fa-meh-o';
            resHuman.title = 'Name is unavailable!';
        }else{
            resHuman.icon = 'fa-warning';
            resHuman.title = 'Check failed!';
        }
        if(!$('.res-title').length){
            var resContainer = $("section.container div.results_body");
            resContainer.append('<div class="res-item res-title col-sm-12 animated flipInX"><div class="res-title res-title-head">Results for:</div> <div class="res-title res-title-query">'+ escape(data.clientSearch) +'</div></div>');
        }
        ospnc.addResult(resJson, resHuman);     

    }); 
};
ospnc.resetSearchInput = function() {
    $('#search').val(function() {
        return this.defaultValue;
    });
};
ospnc.resetSearchDisplay = function() {
    $("div.res-item").remove();
};
ospnc.showAlertWindow = function() {
    swal({
            title: "Hmm...",
            text: "Please enter project name larger than two characters!",
            type: "warning",
            showCancelButton: false,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: 'Okay, i will...'
        },
        function() {
            ospnc.resetSearchInput();
        });
};
ospnc.addResult = function(data, resHuman) {
    var resContainer = $("section .results_body");
    var resId = 'item-' + data.namesafe;    

    var resTemplate = '<div title="' + resHuman.title + '" id="' + resId + '" class="res-item col-sm-12 animated lightSpeedIn">' +
                      '    <div class="col-md-4"><img width="16" height="16" alt="' + data.name + '" src="' + resHuman.favicon + '" /><span>' + data.name + '</span></div>' +
                      '    <div class="col-md-8"><i class="fa ' + resHuman.icon + '"></i><a target="_blank" title="Visit URL on checked page" href="' + data.headers.reqHost + data.headers.reqPath + '">^</a></div>' +
                      '</div>';
    resContainer.append(resTemplate);
};

ospnc.queryServer = function() {
    // Ask server to process query
    socket.emit('process', {
        'guid': client.guid,
        'clientSearch': client.searches[client.counter - 1].searchValue
    });   
};

$(document).ready(function() {
    /* Bin mousetrap to input field */
    var inputSearch = $('#search');
    Mousetrap.bind('enter', function(e) {
        if (e.target === inputSearch[0]) {

            var searchObj = {
                searchValue: inputSearch.val().replace(/\s+/g, '-').toLowerCase()
            };
            if (searchObj.searchValue.length < 3) {
                ospnc.showAlertWindow();
            } else {
                ospnc.resetSearchDisplay();

                searchObj.searchID = client.counter;
                client.searches.push(searchObj);
                client.counter++;

                ospnc.queryServer();
            }

        }
    });
    ospnc.registerUser();
    ospnc.setupSocketEvents();

    // Slide out left menu
    $("#legend").css('left', '-248px');
});

/* Only for production
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-38013109-1', 'auto');
ga('require', 'displayfeatures');
ga('require', 'linkid', 'linkid.js');
ga('send', 'pageview');
*/