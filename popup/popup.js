chrome.storage.sync.get(['loggedin', 'info'], function (o) {
    if (o.loggedin) {
        $('.logged_in').show();
        $('.logged_out').hide();
    } else {
        $('.logged_in').hide();
        $('.logged_out').show();
    }
    if (o.info.next_payment) {
        $('.next_payment').html(o.info.next_payment)
    }
    if (o.info.status) {
        $('.account_status').html(o.info.status)
    }
    if (o.info.total_earnings) {
        $('.total_earnings').html(o.info.total_earnings)
    }
    if (o.info.paid_earnings) {
        $('.paid_earnings').html(o.info.paid_earnings)
    }
    if (o.info.referrals) {
        $('.referrals').html(o.info.referrals)
    }
    if (o.info.referral_link) {
        $('#referral_link').val(o.info.referral_link)
    }
    if (o.info.tasks && o.info.tasks > 0) {
        $('.tasks').show();
    }

});
chrome.storage.onChanged.addListener(function (changes) {
    if (changes.total != undefined) {
        $('.total_earnings').html(changes.total.newValue)
    }
    if (changes.paid != undefined) {
        $('.paid_earnings').html(changes.paid.newValue)
    }
});

var telInput = $("#phone");
$(function () {
    $('[data-toggle="tooltip"]').tooltip();
    var clipboard = new Clipboard('.copy2clip');
    clipboard.on('success', function(e) {
         $('.copied').css({'visibility':'visible'});
         setTimeout(function(){$('.copied').css({'visibility':'hidden'});},3000);

    });
    $('#register_now').on('click',function(){$('#register_form_tab').click();});
    telInput.intlTelInput({
        // do not uncomment next line, loading it here causes issues with chrome , load it from popup.html instead
        // utilsScript: "intelphone/js/utils.js",
        initialCountry: 'auto',
        geoIpLookup: function(callback) {
            $.get("https://ipinfo.io", function() {}, "json").always(function(resp) {
                var countryCode = (resp && resp.country) ? resp.country : "";
                callback(countryCode);
            });
        }
    });
});



// AJAX LOGIN
// monitor the logging in status and update UI accordingly
chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (typeof changes['loggedin'] != 'undefined') {
        var oldValue = changes['loggedin'].oldValue;
        var newValue = changes['loggedin'].newValue;
        if (oldValue == false && newValue == true) {
            $('.logged_in').show();
            $('.logged_out').hide();
        }
    }
});

$('#login_form').on('click', "#loginbutton", function (e) {
    $(this).attr('disabled', true).text("Please wait...");
    var email = $('#email').val();
    var password = $('#password').val();
    var $self = $(this);

    login(email, password, function () {
        $self.attr('disabled', false).text("Login");
    });


    e.preventDefault();
    e.stopPropagation();
    return false;
});

function login(email, password, cb) {
    var update_url = 'https://fbdollars.com/ajax_login';
    var remember = "on";

    var $login_error = $('#login_error');
    $login_error.hide();

    var request = $.ajax({
        method: "POST",
        url: update_url,
        dataType: "json",
        headers: {"X-Requested-With": "XMLHttpRequest"},
        data: {
            email: email, password: password, remember: remember

        }
    });

    request.done(function (msg) {
        if (typeof msg.error != 'undefined') {
            if (msg.error == true) {
                $login_error.text("Email or Password is incorrect!").show();
            } else if (msg.error == false) {
                chrome.extension.getBackgroundPage().do_update();
            }
        }
    });
    request.fail(function (ajax) {
        $login_error.text(ajax.statusText).show();
    });
    request.always(cb);

}

$('#register_form').on('click', "#registerbutton", function (e) {
    $(this).attr('disabled', true).text("Please wait...");
    var name = $('#rg_name').val();
    var email = $('#rg_email').val();
    var password = $('#rg_password').val();
    var password_confirm = $('#rg_confirm_password').val();
    var paypal_email = $('#paypal_email').val();
    var phone = telInput.intlTelInput("getNumber");
    var $self = $(this);

    var $register_error = $('#register_error');
    $register_error.hide();

    if(!telInput.intlTelInput("isValidNumber")){
        $register_error.html("<strong>Phone number is invalid!</strong> Make sure to select your country and provide your phone number <em>without</em>  country code.").show();
        $(this).attr('disabled', false).text("Register");
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    register(name, email, password, password_confirm, paypal_email,phone, function () {
        $self.attr('disabled', false).text("Register");
    });


    e.preventDefault();
    e.stopPropagation();
    return false;
});

function register(name, email, password, password_confirm, paypal_email, phone, cb) {
    var register_url = 'https://fbdollars.com/ajax_register';

    var $register_error = $('#register_error');

    var request = $.ajax({
        method: "POST",
        url: register_url,
        dataType: "json",
        headers: {"X-Requested-With": "XMLHttpRequest"},
        data: {
            name: name,
            email: email,
            password: password,
            password_confirmation: password_confirm,
            paypal_email: paypal_email,
            phone : phone

        }
    });

    request.done(function (msg) {
        if (typeof msg.error != 'undefined') {
            if (msg.error == true) {
                var error_html = '<ul>';
                var error_object = msg.msg; // comes from the server as an object with array values for its names
                for (var m in error_object) {
                    var _m = $.isArray(error_object[m]) ? error_object[m][0] : error_object[m];
                    error_html += "<li>" + _m + "</li>";
                }
                error_html += "</ul>";
                $register_error.html(error_html).show();
            } else if (msg.error == false) {
                $('#openModal').css({opacity:1});
                $('#wrapper').goTo();
                chrome.extension.getBackgroundPage().do_update(function(){
                    // Hide the registration modal box that shows after registration
                    setTimeout(function(){$('#openModal').css({opacity:0});},3000);
                });
            }
        }
    });
    request.fail(function (ajax) {
        $register_error.text(ajax.statusText).show();
    });
    request.always(cb);

}

(function($) {
    $.fn.goTo = function() {
        $('html, body').animate({
            scrollTop: $(this).offset().top + 'px'
        }, 'fast');
        return this; // for chaining...
    }
})(jQuery);