$(document).ready(function () {
    $('.secondaryTab').hide();

    $('#sendlogstotest_button').hide();

});

function ui_startSession() {
    $('#label-start-end').text('Communicating with the server...');
}

function ui_endSession() {
    $('#label-start-end').text('Communicating with the server...');
}

function ui_sessionHasStarted() {
    $('#button-start-end')
            .toggleClass('btn-primary btn-danger')
            .text("End session")
            .attr('onclick', 'endSession()')
            .blur();
    $('#label-start-end').text('You currently have an active session.');

    $('#nmaid')[0].setAttribute("readonly", "");
    $('#nmaid_key')[0].setAttribute("readonly", "");
    $('#username')[0].setAttribute("readonly", "");
    $('#company_name')[0].setAttribute("readonly", "");
    $('#application_name')[0].setAttribute("readonly", "");
    $('#nes_version')[0].setAttribute("readonly", "");
    $('#agent_url')[0].setAttribute("readonly", "");
    $('#api_version')[0].setAttribute("disabled", "");

    $('.secondaryTab').fadeIn();
}

function ui_sessionHasEnded() {
    $('#button-start-end')
            .toggleClass('btn-primary btn-danger')
            .text("Start session")
            .attr('onclick', 'startSession()')
            .blur();
    $('#label-start-end').text('You currently have no active session.');

    $('#nmaid')[0].removeAttribute("readonly");
    $('#nmaid_key')[0].removeAttribute("readonly");
    $('#username')[0].removeAttribute("readonly");
    $('#company_name')[0].removeAttribute("readonly");
    $('#application_name')[0].removeAttribute("readonly");
    $('#nes_version')[0].removeAttribute("readonly");
    $('#agent_url')[0].removeAttribute("readonly");
    $('#api_version')[0].removeAttribute("disabled");

    $('.secondaryTab').fadeOut();
}

function ui_gotLog(file_name, file_url) {
    if (file_name === "session.log" && document.getElementById("log_session.log") != null) {
        // Remove old session.log file.
        var log = document.getElementById("log_session.log");
        log.parentNode.removeChild(log);
    }
    if (document.getElementById("log_"+file_name) != null) {
        // If log file already exists, don't replace it.
        return;
    }

    var ul = document.getElementById("logs_list");

    // <li id="" class="list-group-item"></li>
    var li = document.createElement("li");
    li.setAttribute("id", "log_"+file_name);
    li.setAttribute("class", "list-group-item");

    // <a href="" target="_blank" style=""></a>
    var a = document.createElement("a");
    a.setAttribute("href", file_url);
    a.setAttribute("target", "_blank");
    if (file_name.endsWith(".wav")) {
        a.setAttribute("style", "color:#33cc33");
    }

    // <label class="col-sm-1"></label>
    var label = document.createElement("label");
    label.setAttribute("class", "col-sm-1");

    // <span class="glyphicon glyphicon-"></span>
    var span1 = document.createElement("span");
    span1.setAttribute("class", getIcon(file_name));
    // <label> <span></span> </label>
    label.appendChild(span1);
    // <label> <span></span> <span2></span2> </label>
    if (file_name.indexOf("AndDialog.log") > -1) {
        var span2 = document.createElement("span");
        span2.setAttribute("class", "glyphicon glyphicon-comment");
        label.innerHTML += '&amp;';
        label.appendChild(span2);
    } else if (file_name.indexOf("AndNLU.log") > -1) {
        var span2 = document.createElement("span");
        span2.setAttribute("class", "glyphicon glyphicon-filter");
        label.innerHTML += '&amp;';
        label.appendChild(span2);
    }

    // <a> <label> <span></span> <span2></span2> </label> </a>
    a.appendChild(label);
    // <a> <label> <span></span> <span2></span2> </label> FILENAME </a>
    a.appendChild(document.createTextNode(file_name));
    // <li> <a> <label> <span></span> <span2></span2> </label> FILENAME </a> </li>
    li.appendChild(a);
    if (file_name.endsWith(".wav")) {
        // <button class="btn btn-success btn-sm" onclick="document.getElementById('log_audio_FILE').play();"></button>
        var button = document.createElement("button");
        button.setAttribute("class", "btn btn-success btn-sm");
        button.setAttribute("onclick", "document.getElementById('log_audio_"+file_name+"').play();");
        // <audio id="log_audio_FILE" src="" preload="auto"></audio>
        var audio = document.createElement("audio");
        audio.setAttribute("id", "log_audio_"+file_name);
        audio.setAttribute("src", file_url);
        audio.setAttribute("preload", "auto");
        // <button> Play me </button>
        button.appendChild(document.createTextNode("Play me"));
        // <button> Play me <audio></audio> </button>
        button.appendChild(audio);
        li.innerHTML += '&nbsp;';
        // <li> <a> <label> <span></span> <span2></span2> </label> FILENAME </a> <button> Play me <audio></audio> </button> </li>
        li.appendChild(button);
    }
    ul.appendChild(li);
}

function getIcon(file_name) {
    if (file_name === "session.log") {
        return "glyphicon glyphicon-list-alt";
    }
    else if (file_name.endsWith(".wav")) {
        return "glyphicon glyphicon-volume-up";
    }
    else if (file_name.indexOf("NinaStartSession") > -1 ||
            file_name.indexOf("NinaEndSession") > -1) {
        return "glyphicon glyphicon-off";
    }
    else if (file_name.indexOf("NinaGetLogs") > -1) {
        return "glyphicon glyphicon-file";
    }
    else if (file_name.indexOf("NinaPlayAudio") > -1) {
        return "glyphicon glyphicon-play";
    }
    else if (file_name.indexOf("NinaDoMREC") > -1 ||
            file_name.indexOf("NinaDoNR") > -1 ||
            file_name.indexOf("NinaDoNTE") > -1 ||
            file_name.indexOf("NinaDoSpeechRecognition") > -1) {
        return "glyphicon glyphicon-equalizer";
    }
    else if (file_name.indexOf("ProjectVocabularyActivate") > -1 ||
            file_name.indexOf("ActivateDynamicVocabulary") > -1) {
        return "glyphicon glyphicon-ok-sign";
    }
    else if (file_name.indexOf("ProjectVocabularyDeactivate") > -1 ||
            file_name.indexOf("DeactivateDynamicVocabulary") > -1) {
        return "glyphicon glyphicon-remove-sign";
    }
    else if (file_name.indexOf("GetAllProjectVocabularies") > -1 ||
            file_name.indexOf("GetAllDynamicVocabularies") > -1) {
        return "glyphicon glyphicon-info-sign";
    }
    else if (file_name.indexOf("DeleteProjectVocabulary") > -1) {
        return "glyphicon glyphicon-minus-sign";
    }
    else if (file_name.indexOf("UploadProjectVocabulary") > -1 ||
            file_name.indexOf("UploadDynamicVocabulary") > -1) {
        return "glyphicon glyphicon-plus-sign";
    }
    else if (file_name.indexOf("NinaDoNLU") > -1) {
        return "glyphicon glyphicon-filter";
    }
    else if (file_name.indexOf("NinaDoDialog") > -1) {
        return "glyphicon glyphicon-comment";
    }
    else if (file_name.indexOf("NinaEnrollUser") > -1 ||
            file_name.indexOf("NinaVerifyUserEnrollment") > -1 ||
            file_name.indexOf("NinaAuthenticateUser") > -1) {
        return "glyphicon glyphicon-lock";
    }
    else if (file_name.indexOf("NinaUploadBusinessLogic") > -1) {
        return "glyphicon glyphicon-upload";
    }
    else if (file_name.indexOf("NinaDoBusinessLogic") > -1) {
        return "glyphicon glyphicon-briefcase";
    }
    else if (file_name.indexOf("NinaBLEStatus") > -1) {
        return "glyphicon glyphicon-refresh";
    }
    return "";
}


// Barge-In ui functions.
function ui_startBargeIn() {
    $("[name='barge-in']").bootstrapSwitch('disabled',true);
    $('#playaudio_sr_engine')[0].setAttribute("disabled", "");
    $('#playaudio_nte_mode')[0].setAttribute("disabled", "");
    $('#playaudio_button')[0].setAttribute("disabled", "");
}

function ui_stopBargeIn() {
    $("[name='barge-in']").bootstrapSwitch('disabled',false);
    $('#playaudio_sr_engine')[0].removeAttribute("disabled");
    $('#playaudio_nte_mode')[0].removeAttribute("disabled");
    $('#playaudio_button')[0].removeAttribute("disabled");
}


// Speech recognition ui functions.

function ui_startSRRecording() {
    $('#sr_results').text("");
    $('#sr_engine')[0].setAttribute("disabled", "");
    $('#nte_mode')[0].setAttribute("disabled", "");
    
    $('#sr_button')
            .toggleClass('btn-primary btn-danger')
            .text("Stop recording")
            .attr('onclick', 'stopSRRecording()')
            .blur();
}

function ui_stopSRRecording() {
    $('#sr_button')
            .toggleClass('btn-primary btn-danger')
            .text("Start recording")
            .attr('onclick', 'startSRRecording()')
            .blur();

    $('#nte_mode')[0].removeAttribute("disabled");
    $('#sr_engine')[0].removeAttribute("disabled");
}


// NLU ui functions.

function ui_startNLUNRRecording() {
    $('#nlu_nr_results').text("");
    $('#nlu_nr_text')[0].setAttribute("disabled", "");
    $('#nlu_nr_txtbutton')[0].setAttribute("disabled", "");

    $('#nlu_nr_sr_button')
            .toggleClass('btn-primary btn-danger')
            .text("Stop recording")
            .attr('onclick', 'stopNLUNRRecording()')
            .blur();
}

function ui_stopNLUNRRecording() {
    $('#nlu_nr_sr_button')
            .toggleClass('btn-primary btn-danger')
            .text("Start recording")
            .attr('onclick', 'startNLUNRRecording()')
            .blur();

    $('#nlu_nr_text')[0].removeAttribute("disabled");
    $('#nlu_nr_txtbutton')[0].removeAttribute("disabled");
}

function ui_startNLUNLERecording() {
    $('#nlu_nle_results').text("");
    $('#nlu_nle_text')[0].setAttribute("disabled", "");
    $('#nlu_nle_txtbutton')[0].setAttribute("disabled", "");

    $('#nlu_nle_sr_button')
            .toggleClass('btn-primary btn-danger')
            .text("Stop recording")
            .attr('onclick', 'stopNLUNLERecording()')
            .blur();
}

function ui_stopNLUNLERecording() {
    $('#nlu_nle_sr_button')
            .toggleClass('btn-primary btn-danger')
            .text("Start recording")
            .attr('onclick', 'startNLUNLERecording()')
            .blur();

    $('#nlu_nle_text')[0].removeAttribute("disabled");
    $('#nlu_nle_txtbutton')[0].removeAttribute("disabled");
}

// Dialog ui functions.

function ui_startDialogNIWRecording() {
    $('#dialog_niw_srResults').text("");
    $('#dialog_niw_dialogResults').text("");
    $('#dialog_niw_text')[0].setAttribute("disabled", "");
    $('#dialog_niw_txtbutton')[0].setAttribute("disabled", "");
    $('#dialog_niw_sr_engine')[0].setAttribute("disabled", "");
    $('#dialog_niw_nte_mode')[0].setAttribute("disabled", "");

    $('#dialog_niw_sr_button')
            .toggleClass('btn-primary btn-danger')
            .text("Stop recording")
            .attr('onclick', 'stopDialogNiwRecording()')
            .blur();
}

function ui_stopDialogNIWRecording() {
    $('#dialog_niw_sr_button')
            .toggleClass('btn-primary btn-danger')
            .text("Start recording")
            .attr('onclick', 'startDialogNiWRecording()')
            .blur();

    $('#dialog_niw_text')[0].removeAttribute("disabled");
    $('#dialog_niw_txtbutton')[0].removeAttribute("disabled");
    $('#dialog_niw_sr_engine')[0].removeAttribute("disabled");
    $('#dialog_niw_nte_mode')[0].removeAttribute("disabled");
}

function ui_startDialogNCERecording() {
    $('#dialog_nce_srResults').text("");
    $('#dialog_nce_dialogResults').text("");
    $('#dialog_nce_text')[0].setAttribute("disabled", "");
    $('#dialog_nce_txtbutton')[0].setAttribute("disabled", "");
    $('#dialog_nce_sr_engine')[0].setAttribute("disabled", "");
    $('#dialog_nce_nte_mode')[0].setAttribute("disabled", "");

    $('#dialog_nce_sr_button')
            .toggleClass('btn-primary btn-danger')
            .text("Stop recording")
            .attr('onclick', 'stopDialogNCERecording()')
            .blur();
}

function ui_stopDialogNCERecording() {
    $('#dialog_nce_sr_button')
            .toggleClass('btn-primary btn-danger')
            .text("Start recording")
            .attr('onclick', 'startDialogNCERecording()')
            .blur();

    $('#dialog_nce_text')[0].removeAttribute("disabled");
    $('#dialog_nce_txtbutton')[0].removeAttribute("disabled");
    $('#dialog_nce_sr_engine')[0].removeAttribute("disabled");
    $('#dialog_nce_nte_mode')[0].removeAttribute("disabled");
}

// Vocal Password ui functions

function ui_checkUserEnrollment() {
    $('#vp_results').text('Communicating with the server...');
    $('#vp_check_button')[0].setAttribute("disabled", "");
    $('#vp_enroll_button')[0].setAttribute("disabled", "");
    $('#vp_authenticate_button')[0].setAttribute("disabled", "");
}

function ui_checkedUserEnrollment() {
    $('#vp_check_button')[0].removeAttribute("disabled");
    $('#vp_enroll_button')[0].removeAttribute("disabled");
    $('#vp_authenticate_button')[0].removeAttribute("disabled");
}

function ui_VPStartEnrollRecording() {
    $('#vp_results').text("");

    $('#vp_enroll_button')
            .toggleClass('btn-primary btn-danger')
            .text("Stop recording")
            .attr('onclick', 'vpStopEnrollRecording()')
            .blur();

    $('#vp_authenticate_button')[0].setAttribute("disabled", "");
    $('#vp_check_button')[0].setAttribute("disabled", "");
}

function ui_VPStopEnrollRecording() {
    $('#vp_enroll_button')
            .toggleClass('btn-primary btn-danger')
            .text("Enroll")
            .attr('onclick', 'vpStartEnrollRecording()')
            .blur();

    $('#vp_authenticate_button')[0].removeAttribute("disabled");
    $('#vp_check_button')[0].removeAttribute("disabled");
}

function ui_VPStartAuthenticateRecording() {
    $('#vp_results').text("");

    $('#vp_authenticate_button')
            .toggleClass('btn-primary btn-danger')
            .text("Stop recording")
            .attr('onclick', 'vpStopAuthenticateRecording()')
            .blur();

    $('#vp_enroll_button')[0].setAttribute("disabled", "");
    $('#vp_check_button')[0].setAttribute("disabled", "");
}

function ui_VPStopAuthenticateRecording() {
    $('#vp_authenticate_button')
            .toggleClass('btn-primary btn-danger')
            .text("Authenticate")
            .attr('onclick', 'vpStartAuthenticateRecording()')
            .blur();

    $('#vp_enroll_button')[0].removeAttribute("disabled");
    $('#vp_check_button')[0].removeAttribute("disabled");
}


// Project Vocabulary ui functions

function ui_ProjectVocabActivate() {
    $('#pv_activation_btn')
            .toggleClass('btn-primary btn-danger')
            .text("Deactivate")
            .attr('onclick', 'projectVocabDeactivate()')
            .blur();

    $('#activate_pv_name')[0].setAttribute("readonly", "");
    $('#activate_pv_weight')[0].setAttribute("disabled", "");
}

function ui_ProjectVocabDeactivate() {
    $('#pv_activation_btn')
            .toggleClass('btn-primary btn-danger')
            .text("Activate")
            .attr('onclick', 'projectVocabActivate()')
            .blur();

    $('#activate_pv_name')[0].removeAttribute("readonly");
    $('#activate_pv_weight')[0].removeAttribute("disabled");
}



