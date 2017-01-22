(function(){
    var sHost = "nim-rd.nuance.mobi";
    var sPort = 9443;

    var socketPath = "nina-webapi/nina";

    // For the NinaStartSession CONNECT message
    var nmaid = "Nuance_ConUHack2017_20170119_210049";
    var nmaidKey = "0d11e9c5b897eefdc7e0aad840bf4316a44ea91f0d76a2b053be294ce95c7439dee8c3a6453cf7db31a12e08555b266d54c2300470e4140a4ea4c8ba285962fd";
    var username = "websocket_sample";

    // For the NinaStartSession COMMAND message. All set in the startSession() index.html page
    var appName;
    var companyName;
    var cloudModelVersion;
    var clientAppVersion;
    var defaultAgent;

    // Audio handlers
    var audioContext = initAudioContext();
    var audioPlayer = new AudioPlayer(audioContext); // For the play audio command

    // The current command (used when receiving end-of-speech and beginning-of-speech)
    var currentCommand;

    // The WebSocket
    var socket;

    function initWebSocket() {
        console.log('hi');
        socket = new WebSocket("wss://" + sHost + ":" + sPort + "/" + socketPath); // The WebSocket must be secure "wss://"
        socket.binaryType = "arraybuffer"; // Important for receiving audio

        socket.onopen = function () {   
            console.log("WebSocket connection opened.");

            socket.send(JSON.stringify({
                connect: {
                    nmaid: 'Nuance_ConUHack2017_20170119_210049',
                    nmaidKey: '0d11e9c5b897eefdc7e0aad840bf4316a44ea91f0d76a2b053be294ce95c7439dee8c3a6453cf7db31a12e08555b266d54c2300470e4140a4ea4c8ba285962fd',
                    username: 'websocket_sample'
                }
            }));
            socket.send(JSON.stringify({
                command: {
                    name: "NinaStartSession",
                    logSecurity: 'off',
                    appName: 'Gifi',
                    companyName: 'ConUStanleyH',
                    cloudModelVersion: '1.0.2',
                    clientAppVersion: '0.0',
                    agentURL: 'http://ac-srvozrtr01.dev.ninaweb.nuance.com/nuance-nim_team-englishus-WebBotRouter/jbotservice.asmx/TalkAgent',
                    apiVersion: 'LATEST'
                }
            }));
            currentCommand = "NinaStartSession";
        };

        socket.onclose = function () {
            if(!alert("WebSocket connection closed.")) {
                window.location.reload(true);
            }
        };

        socket.onmessage = function (event) {
            console.log("socket RECEIVED:");

            // if (isOfType("ArrayBuffer", event.data))
            // { // The play audio command will return ArrayBuffer data to be played
            //     console.log("ArrayBuffer");
            //     audioPlayer.play(event.data);
            // }
            // else
            // { // event.data should be text and you can parse it
                var response = JSON.parse(event.data);
                console.log(response);

                if (response.ControlData)
                {
                    if (response.ControlData === "beginning-of-speech") {
                        $('#nlu_nr_srResults').text(JSON.stringify(response, null, 4));
                    }
                    else if (response.ControlData === "end-of-speech") {
                        $('#nlu_nr_srResults').text(JSON.stringify(response, null, 4));
                        stopNLUNRRecording();
                    }
                    else alert(JSON.stringify(response));
                }
                else if (response.QueryResult)
                {
                    console.log(JSON.stringify(response, null, 4));

            }
        };
    };


    function startSession() {
        ui_startSession();
        // if (socket === undefined) {
        //     initWebSocket();
        // }
    }

    function endSession() {
        ui_endSession();

        defaultAgent = "";
        
        socket.send(JSON.stringify({
            command: {
                name: "NinaEndSession",
                logSecurity: $('#start-end_logSecurity')[0].value
            }
        }));
        currentCommand = "NinaEndSession";
    }

    function startNLUNRRecording() {
        ui_startNLUNRRecording();

        var srEngine = document.getElementById("nlu_nr_sr_engine").value;
        var mode = document.getElementById("nlu_nr_nte_mode").value;

        if ($('#nlu_nr_sr_formURL')[0].checked) {
            socket.send(JSON.stringify({
                command: {
                    name: "NinaDoSpeechRecognitionAndNLU",
                    logSecurity: $('#nlu_nr_sr_logSecurity')[0].value,
                    sr_engine: srEngine,
                    sr_engine_parameters: {operating_mode:mode},
                    sr_audio_file: $('#nlu_nr_srFromFile_url')[0].value, // https://dl.dropboxusercontent.com/s/23knztcspmmrcii/9.%20Famous%20Full%20Obama%20Speech%20on%20Race%20Relations%20-%20A%20More%20Perfect%20Union.mp4
                    nlu_engine: "NR"
                }
            }));
            currentCommand = "NinaDoSpeechRecognitionAndNLU_NR_fromAudioFile";
        }
        else {
            socket.send(JSON.stringify({
                command: {
                    name: "NinaDoSpeechRecognitionAndNLU",
                    logSecurity: $('#nlu_nr_sr_logSecurity')[0].value,
                    sr_engine: srEngine,
                    sr_engine_parameters: {operating_mode:mode},
                    nlu_engine: "NR"
                }
            }));
            currentCommand = "NinaDoSpeechRecognitionAndNLU_NR";
            record();
        }

    };

function startNLUNLERecording() {
    var srEngine = 'MREC';
    var mode = 'Accurate';

    socket.send(JSON.stringify({
        command: {
            name: "NinaDoSpeechRecognitionAndNLU",
            logSecurity: 'off'.value,
            sr_engine: srEngine,
            sr_engine_parameters: {operating_mode:mode},
            nlu_engine: "NLE"
        }
    }));
    currentCommand = "NinaDoSpeechRecognitionAndNLU_NLE";
    record();
}

function stopNLUNLERecording() {
    stopRecording();
}

function record() {
    shouldStopRecording = false;  
    console.log("Recorder started.");

    // IMPORTANT Make sure you create a new AudioRecorder before you start recording to avoid any bugs !!!
    audioRecorder = new AudioRecorder(audioContext);

    audioRecorder.start().then(

            // This callback is called when "def.resolve" is called in the AudioRecorder.
            // def.resolve
            function () {
                console.log("Recorder stopped.");
            },

            // def.reject
            function () {
                console.log("Recording failed!!!");
            },

            // def.notify
            function (data) { // When the recorder receives audio data
                console.log("Audio data received...");

                if (shouldStopRecording) {
                    return;
                }

                // tuple: [encodedSpx, ampArray]
                //   resampled audio as Int16Array 
                //   amplitude data as Uint8Array
                var frames = data[0]; // Int16Array

                socket.send(frames.buffer);
            }
    );
}

function stopRecording() {
    shouldStopRecording = true;

    audioRecorder.stop();
    audioRecorder = undefined;

    socket.send(JSON.stringify({
        endcommand: {}
    }));
}
    initWebSocket();

    var output = PUBNUB.$('output'), 
        input = PUBNUB.$('input'), 
        button = PUBNUB.$('button'),
        presence = PUBNUB.$('presence');

    var channel = 'giphy-chat';
    
    var p = PUBNUB.init({
        subscribe_key: 'sub-c-311e361c-e018-11e6-884c-0619f8945a4f',
        publish_key:   'pub-c-d280fc15-f95c-4873-802c-d701bd521560'
    });

    p.history({
        channel  : channel,
        count    : 2,
        callback : function(messages) {

            p.each( messages[0], function(m){
                var content = '<p><span>';
                // var content;
                if(m.text) {
                    content += m.text.replace( /[<>]/ig, '' );
                }
                if(m.gif) {
                    console.log('giphy added...');
                    content += '<img src="' + m.gif + '">'
                }
                content += '</span></p>';

                output.innerHTML = content + output.innerHTML; 
            } );
        }
    });


    p.subscribe({
        channel  : channel,
        callback : function(m, e, c) {
                    console.log('subscribe');

            console.log(m, e, c);  console.log(m);
            // actionUser = m.avatar;
            var content = '<p></i><span>';
            // var content;
            if(m.text) {
                content += m.text.replace( /[<>]/ig, '' );
            }
            if(m.gif) {
                console.log('giphy added...');
                content += '<img src="' + m.gif + '">'
            }
            content += '</span></p>';

            output.innerHTML = content + output.innerHTML; 
        },
    });

    p.bind('click', button, startNLUNLERecording);
    p.bind('click', button1, stopNLUNLERecording);

var audioRecorder;
var shouldStopRecording = true;

    function publish() {
        console.log('publish');
        var text = '\\giphy ' + input.value;

        if(!text) return;

        p.publish({
            channel : channel, 
            message : {text: text}, 
            callback : function(m) {
                input.value = '';
                console.log(m);
                if (['\giphy'].some(function(v) { return text.toLowerCase().indexOf(v) > 0; })) {
                    var query = text.split(' ').join('+');
                    console.log(query);
                    getGiphy(query);
                }
            }
        });
    }

    function publishGif(gif) {
        p.publish({
            channel : channel, 
            message : {gif: gif}
        });
    }

    function getGiphy(q) {
        var url = 'http://api.giphy.com/v1/gifs/translate?api_key=dc6zaTOxFJmzC&s=' + q;

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onload = function(){
            var json = JSON.parse(xhr.response);
            var gif = json.data.images.fixed_height.url;
            publishGif(gif);
        };
        xhr.onerror = function(){
            console.log(e);
        };
        xhr.send();
    }
})();