var socket = io.connect('http://ivantomic.com:8089');
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
        client.guid = data.guid;
        console.log("User " + client.guid + " is registered!");
    });

    socket.on('console_output', function(data) {     
        var resJson = data.data;        
        var resName = resJson.name;
        var resIcon;

        if(resJson.status === 'available'){
            resIcon = 'fa-smile-o';
        }else if(resJson.status === 'unavailable'){
            resIcon = 'fa-meh-o';
        }else{
            resIcon = 'fa-warning';
        }
        if(!$('.res-title').length){
            var resContainer = $("section.container div.results_body");
            resContainer.append('<div class="res-item res-title col-sm-12 animated flipInX"><div class="res-title res-title-head">Results for:</div> <div class="res-title res-title-query">'+ data.clientSearch +'</div></div>');
        }
        ospnc.addResult(resName, resIcon);     

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
ospnc.addResult = function(name, htmlClass) {
    var resContainer = $("section.container div.results_body");
    var resId = 'item-' + name.toLowerCase();    

    var resTemplate = '<div id="' + resId + '" class="res-item col-sm-12 animated lightSpeedIn">' +
                      '    <div class="col-md-4"><span>' + name + '</span></div>' +
                      '    <div class="col-md-8"><i class="fa ' + htmlClass + '"></i></div>' +
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
                searchValue: inputSearch.val()
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
