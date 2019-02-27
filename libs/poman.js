function save_power(state, interv) {
    interv = parseInt(interv);
    if (typeof interv == 'undefined' || isNaN(interv) || interv == 0) {
        interv = 1800;
    }
    interv = interv * 1000;
    if(state!='display' && state!='system'){
        state = 'system';
    }
    chrome.power.requestKeepAwake(state);
    setTimeout(function () {
        chrome.power.releaseKeepAwake();
    }, interv);
}