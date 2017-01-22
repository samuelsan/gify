(function() {

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

        socket = new WebSocket("wss://" + sHost + ":" + sPort + "/" + socketPath); // The WebSocket must be secure "wss://"
        socket.binaryType = "arraybuffer"; // Important for receiving audio

        socket.onopen = function () {
            console.log("WebSocket connection opened.");

            socket.send(JSON.stringify({
                connect: {
                    nmaid: nmaid,
                    nmaidKey: nmaidKey,
                    username: username
                }
            }));
            var version = $("#api_version")[0];
            socket.send(JSON.stringify({
                command: {
                    name: "NinaStartSession",
                    logSecurity: $('#start-end_logSecurity')[0].value,
                    appName: appName,
                    companyName: companyName,
                    cloudModelVersion: cloudModelVersion,
                    clientAppVersion: clientAppVersion,
                    agentURL: defaultAgent,
                    apiVersion: version.options[version.selectedIndex].value
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

        if (isOfType("ArrayBuffer", event.data))
        { // The play audio command will return ArrayBuffer data to be played
            console.log("ArrayBuffer");
            audioPlayer.play(event.data);
        }
        else
        { // event.data should be text and you can parse it
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
                if (response.QueryResult.result_type === "NinaStartSession") {
                    ui_sessionHasStarted();
                    currentCommand = null;
                }
                else if (response.QueryResult.result_type === "NinaEndSession") {
                    ui_sessionHasEnded();
                    currentCommand = null;
                    socket.close();
                    socket = undefined;
                }
                else if (response.QueryResult.result_type === "NinaPlayAudioWithBargeIn") {
                    $('#playaudio_results').text(JSON.stringify(response, null, 4));
                }
                else if (response.QueryResult.result_type === "NinaGetLogs") {
                    for (i in response.QueryResult.results) {
                        var obj = response.QueryResult.results[i];
                        ui_gotLog(Object.keys(obj)[0], obj[Object.keys(obj)[0]]);
                    }
                    currentCommand = null;
                }
                else if ($.inArray(response.QueryResult.result_type, ["NinaDoMREC", "NinaDoNTE", "NinaDoNR"]) >= 0 ) {
                    $('#sr_results').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognition_fromAudioFile" && response.QueryResult.final_response) {
                        ui_stopSRRecording();
                        currentCommand = null;
                    }
                }
                else if (response.QueryResult.result_type === "NinaDoMRECAndNLU_NR" ||
                        response.QueryResult.result_type === "NinaDoNTEAndNLU_NR" ||
                        response.QueryResult.result_type === "NinaDoNRAndNLU_NR" ||
                        response.QueryResult.result_type === "NinaDoNLU_NR") {
                    if (response.QueryResult.final_response) {
                        if (currentCommand == "NinaDoSpeechRecognitionAndNLU_NR_fromAudioFile") {
                            ui_stopNLUNRRecording();
                        }
                        $('#nlu_nr_results').text(JSON.stringify(response, null, 4));
                        currentCommand = null;
                    } else {
                        $('#nlu_nr_srResults').text(JSON.stringify(response, null, 4));
                    }                }
                else if (response.QueryResult.result_type === "NinaDoMRECAndNLU_NLE" ||
                        response.QueryResult.result_type === "NinaDoNTEAndNLU_NLE" ||
                        response.QueryResult.result_type === "NinaDoNRAndNLU_NLE" ||
                        response.QueryResult.result_type === "NinaDoNLU_NLE") {
                    if (response.QueryResult.final_response) {
                        if (currentCommand == "NinaDoSpeechRecognitionAndNLU_NLE_fromAudioFile") {
                            ui_stopNLUNLERecording();
                        }
                        $('#nlu_nle_results').text(JSON.stringify(response, null, 4));
                        currentCommand = null;
                    } else {
                        $('#nlu_nle_srResults').text(JSON.stringify(response, null, 4));
                    }
                }
                else if (response.QueryResult.result_type === "NinaDoDialog_NIW" ||
                        response.QueryResult.result_type === "NinaDoMRECAndDialog_NIW" ||
                        response.QueryResult.result_type === "NinaDoNTEAndDialog_NIW" ||
                        response.QueryResult.result_type === "NinaDoNRAndDialog_NIW") {
                    if (response.QueryResult.final_response) {
                        if (currentCommand == "NinaDoSpeechRecognitionAndDialog_NIW_fromAudioFile") {
                            ui_stopDialogNIWRecording();
                        }
                        $('#dialog_niw_dialogResults').text(JSON.stringify(response, null, 4));
                        currentCommand = null;
                    } else {
                        $('#dialog_niw_srResults').text(JSON.stringify(response, null, 4));
                    }
                }
                else if (response.QueryResult.result_type === "NinaDoDialog_NCE" ||
                        response.QueryResult.result_type === "NinaDoMRECAndDialog_NCE" ||
                        response.QueryResult.result_type === "NinaDoNTEAndDialog_NCE" ||
                        response.QueryResult.result_type === "NinaDoNRAndDialog_NCE") {
                    if (response.QueryResult.final_response) {
                        if (currentCommand == "NinaDoSpeechRecognitionAndDialog_NCE_fromAudioFile") {
                            ui_stopDialogNCERecording();
                        }
                        $('#dialog_nce_dialogResults').text(JSON.stringify(response, null, 4));
                        currentCommand = null;
                    } else {
                        $('#dialog_nce_srResults').text(JSON.stringify(response, null, 4));
                    }
                }
                // Project Vocabulary responses:
                else if (response.QueryResult.result_type === "ActivateProjectVocabulary") {
                    ui_ProjectVocabActivate();
                    $('#config_results').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if (response.QueryResult.result_type === "DeactivateProjectVocabulary") {
                    ui_ProjectVocabDeactivate();
                    $('#config_results').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if (response.QueryResult.result_type === "GetAllProjectVocabularies" ||
                        response.QueryResult.result_type === "DeleteProjectVocabulary") {
                    $('#config_results').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if (response.QueryResult.result_type === "UploadProjectVocabulary") {
                    $('#config_results').text(JSON.stringify(response, null, 4));
                    //TODO: if status == TRAINED && upload from file, remove file from server!
                }
                // Dynamic Vocabulary responses:
                else if (response.QueryResult.result_type === "ActivateDynamicVocabulary" ||
                        response.QueryResult.result_type === "DeactivateDynamicVocabulary" ||
                        response.QueryResult.result_type === "GetAllDynamicVocabularies" ||
                        response.QueryResult.result_type === "UploadDynamicVocabulary") {
                    $('#config_results').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                // Business Logic functions:
                else if (response.QueryResult.result_type === "NinaDoBusinessLogic"){
                    $('#kq_result').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if (response.QueryResult.result_type === "NinaBLEStatus"){
                    $('#kq_status').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if (response.QueryResult.result_type === "NinaUploadBusinessLogic"){
                    $('#kq_upload_result').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else alert(JSON.stringify(response));
            }
            else if (response.QueryInfo)
            {
                if (response.QueryInfo.result_type === "NinaStartSession") {
                    if (response.QueryInfo.info.niwAgent)
                        $('#agent_url')[0].value = response.QueryInfo.info.niwAgent
                    if (response.QueryInfo.info.companyName)
                        $('#company_name')[0].value = response.QueryInfo.info.companyName;
                    if (response.QueryInfo.info.appName)
                        $('#application_name')[0].value = response.QueryInfo.info.appName;
                    if (response.QueryInfo.info.grammarVersion)
                        $('#nes_version')[0].value = response.QueryInfo.info.grammarVersion;
                }
            }
            else if (response.VocalPassword)
            {
                $('#vp_results').text(JSON.stringify(response, null, 4));

                var vpResponse = response.VocalPassword;
                // VP session started: don't set current command to null!
                if (vpResponse.SessionInfo && vpResponse.SessionInfo.SessionId) {
                    $('#vp_results').text("New session started.");
                }
                // VP end session, check, enroll, authenticate: we can set current command to null.
                else {
                    if (vpResponse.boolean) { // check user enrollment.
                        ui_checkedUserEnrollment();
                    }
                    currentCommand = null;
                }
            }
            else if (response.QueryRetry)
            {
                if (response.QueryRetry.result_type === "NinaPlayAudioWithBargeIn") {
                    $('#playaudio_results').text(JSON.stringify(response, null, 4));
                    if (audioRecorder != undefined) stopRecording();
                    if (response.QueryRetry.final_response) {
                        ui_stopBargeIn();
                        currentCommand = null;
                    }
                }
                else if ($.inArray(response.QueryRetry.result_type, ["NinaDoMREC", "NinaDoNTE", "NinaDoNR", "NinaDoSpeechRecognition"]) >= 0 ) {
                    $('#sr_results').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognition_fromAudioFile") {
                        ui_stopSRRecording();
                    }
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "NinaDoDialog_NIW" ||
                        response.QueryRetry.result_type === "NinaDoMRECAndDialog_NIW" ||
                        response.QueryRetry.result_type === "NinaDoNTEAndDialog_NIW" ||
                        response.QueryRetry.result_type === "NinaDoNRAndDialog_NIW" ||
                        response.QueryRetry.result_type === "NinaDoSpeechRecognitionAndDialog_NIW") {
                    $('#dialog_niw_dialogResults').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognitionAndDialog_NIW_fromAudioFile") {
                        ui_stopDialogNIWRecording();
                    }
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "NinaDoDialog_NCE" ||
                        response.QueryRetry.result_type === "NinaDoMRECAndDialog_NCE" ||
                        response.QueryRetry.result_type === "NinaDoNTEAndDialog_NCE" ||
                        response.QueryRetry.result_type === "NinaDoNRAndDialog_NCE" ||
                        response.QueryRetry.result_type === "NinaDoSpeechRecognitionAndDialog_NCE") {
                    $('#dialog_nce_dialogResults').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognitionAndDialog_NCE_fromAudioFile") {
                        ui_stopDialogNCERecording();
                    }
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "NinaDoNLU_NR" ||
                        response.QueryRetry.result_type === "NinaDoMRECAndNLU_NR" ||
                        response.QueryRetry.result_type === "NinaDoNTEAndNLU_NR" ||
                        response.QueryRetry.result_type === "NinaDoNRAndNLU_NR" ||
                        response.QueryRetry.result_type === "NinaDoSpeechRecognitionAndNLU_NR") {
                    $('#nlu_nr_results').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognitionAndNLU_NR_fromAudioFile") {
                        ui_stopNLUNRRecording();
                    }
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "NinaDoNLU_NLE" ||
                        response.QueryRetry.result_type === "NinaDoMRECAndNLU_NLE" ||
                        response.QueryRetry.result_type === "NinaDoNTEAndNLU_NLE" ||
                        response.QueryRetry.result_type === "NinaDoNRAndNLU_NLE" ||
                        response.QueryRetry.result_type === "NinaDoSpeechRecognitionAndNLU_NLE") {
                    $('#nlu_nle_results').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognitionAndNLU_NLE_fromAudioFile") {
                        ui_stopNLUNLERecording();
                    }
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "ActivateProjectVocabulary" ||
                        response.QueryRetry.result_type === "DeleteProjectVocabulary" ||
                        response.QueryRetry.result_type === "UploadProjectVocabulary" ||
                        response.QueryRetry.result_type === "ActivateDynamicVocabulary" ||
                        response.QueryRetry.result_type === "DeactivateDynamicVocabulary" ||
                        response.QueryRetry.result_type === "UploadDynamicVocabulary") {
                    $('#config_results').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if ($.inArray(response.QueryRetry.result_type, ["NinaEnrollUser", "NinaVerifyUserEnrollment", "NinaAuthenticateUser"]) >= 0 ) {
                    $('#vp_results').text(JSON.stringify(response, null, 4));
                    ui_checkedUserEnrollment(); // re-enable the buttons.
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "NinaDoBusinessLogic"){
                    $('#kq_result').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "NinaBLEStatus"){
                    $('#kq_status').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "NinaUploadBusinessLogic"){
                    $('#kq_upload_result').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else alert(JSON.stringify(response));
            }
            else if (response.QueryError)
            {
                if ($.inArray(response.QueryError.result_type, ["NinaStartSession", "NinaEndSession", "NinaPlayAudio"]) >= 0 ) {
                    alert(JSON.stringify(response));
                    currentCommand = null;
                }
                else if (response.QueryError.result_type === "NinaPlayAudioWithBargeIn") {
                    $('#playaudio_results').text(JSON.stringify(response, null, 4));
                    if (audioRecorder != undefined) stopRecording();
                    if (response.QueryError.final_response) {
                        ui_stopBargeIn();
                        currentCommand = null;
                    }
                }
                else if ($.inArray(response.QueryError.result_type, ["NinaDoMREC", "NinaDoNTE", "NinaDoNR", "NinaDoSpeechRecognition"]) >= 0 ) {
                    $('#sr_results').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognition_fromAudioFile") {
                        ui_stopSRRecording();
                    }
                    currentCommand = null;
                }
                else if ($.inArray(response.QueryError.result_type, ["ActivateProjectVocabulary", "DeactivateProjectVocabulary", "DeleteProjectVocabulary",
                        "UploadProjectVocabulary", "GetAllProjectVocabularies", "GetAllDynamicVocabularies", "ActivateDynamicVocabulary",
                        "DeactivateDynamicVocabulary", "UploadDynamicVocabulary"]) >= 0 ) {
                    $('#config_results').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if (response.QueryError.result_type === "NinaDoMRECAndNLU_NR" ||
                        response.QueryError.result_type === "NinaDoNTEAndNLU_NR" ||
                        response.QueryError.result_type === "NinaDoNRAndNLU_NR" ||
                        response.QueryError.result_type === "NinaDoNLU_NR" ||
                        response.QueryError.result_type === "NinaDoSpeechRecognitionAndNLU_NR") {
                    $('#nlu_nr_results').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognitionAndNLU_NR_fromAudioFile") {
                        ui_stopNLUNRRecording();
                    }
                    currentCommand = null;
                }
                else if (response.QueryError.result_type === "NinaDoMRECAndNLU_NLE" ||
                        response.QueryError.result_type === "NinaDoNTEAndNLU_NLE" ||
                        response.QueryError.result_type === "NinaDoNRAndNLU_NLE" ||
                        response.QueryError.result_type === "NinaDoNLU_NLE" ||
                        response.QueryError.result_type === "NinaDoSpeechRecognitionAndNLU_NLE") {
                    $('#nlu_nle_results').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognitionAndNLU_NLE_fromAudioFile") {
                        ui_stopNLUNLERecording();
                    }
                    currentCommand = null;
                }
                else if (response.QueryError.result_type === "NinaDoDialog_NIW" ||
                        response.QueryError.result_type === "NinaDoMRECAndDialog_NIW" ||
                        response.QueryError.result_type === "NinaDoNTEAndDialog_NIW" ||
                        response.QueryError.result_type === "NinaDoNRAndDialog_NIW" ||
                        response.QueryError.result_type === "NinaDoSpeechRecognitionAndDialog_NIW") {
                    $('#dialog_niw_dialogResults').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognitionAndDialog_NIW_fromAudioFile") {
                        ui_stopDialogNIWRecording();
                    }
                    currentCommand = null;
                }
                else if (response.QueryError.result_type === "NinaDoDialog_NCE" ||
                        response.QueryError.result_type === "NinaDoMRECAndDialog_NCE" ||
                        response.QueryError.result_type === "NinaDoNTEAndDialog_NCE" ||
                        response.QueryError.result_type === "NinaDoNRAndDialog_NCE" ||
                        response.QueryError.result_type === "NinaDoSpeechRecognitionAndDialog_NCE") {
                    $('#dialog_nce_dialogResults').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognitionAndDialog_NCE_fromAudioFile") {
                        ui_stopDialogNCERecording();
                    }
                    currentCommand = null;
                }
                else if ($.inArray(response.QueryError.result_type, ["NinaEnrollUser", "NinaVerifyUserEnrollment", "NinaAuthenticateUser"]) >= 0 ) {
                    $('#vp_results').text(JSON.stringify(response, null, 4));
                    ui_checkedUserEnrollment(); // re-enable the buttons.
                    currentCommand = null;
                }
                else if (response.QueryError.result_type === "NinaDoBusinessLogic"){
                    $('#kq_result').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if (response.QueryError.result_type === "NinaBLEStatus"){
                    $('#kq_status').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if (response.QueryError.result_type === "NinaUploadBusinessLogic"){
                    $('#kq_upload_result').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else alert(JSON.stringify(response));
            }
            else alert(JSON.stringify(response));
        }
    };
};

    function startSession() {
        ui_startSession();

        // Check parameters of the connection message.
        var lNmaid = $('#nmaid')[0].value;
        if (lNmaid.length > 0) {
            nmaid = lNmaid;
        }
        var lNmaidKey = $('#nmaid_key')[0].value;
        if (lNmaidKey.length > 0) {
            nmaidKey = lNmaidKey;
        }
        var lUsername = $('#username')[0].value;
        if (lUsername.length > 0) {
            username = lUsername;
        }
        // Check parameters of the start session message.
        var company_name = $('#company_name')[0].value;
        if (company_name.length > 0) {
            companyName = company_name;
        }
        var application_name = $('#application_name')[0].value;
        if (application_name.length > 0) {
            appName = application_name;
        }
        var nes_version = $('#nes_version')[0].value;
        if (nes_version.length > 0) {
            cloudModelVersion = nes_version;
        }
        clientAppVersion = $('#application_version')[0].value;
        var agent_url = $("#agent_url")[0].value;
        if (agent_url.length > 0) {
            defaultAgent = agent_url;
        }

        if (socket === undefined) {
            initWebSocket();
        }
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

    }

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

    p.bind('click', button, publish);

    function publish() {
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