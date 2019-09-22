function get(endpoint) {
    if (firebase.auth().currentUser) {
        firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function (idToken) {
            // Send token to backend and load response
            // console.log(idToken);
            $.ajax({
                url: "/" + endpoint,
                type: 'get',
                dataType: 'html',
                headers: { 'Authorization': idToken },
                success: function (html) {
                    history.pushState({}, endpoint, "/" + endpoint);
                    $("#content").html(html);
                },
                error: function () {
                    alert("Error");
                }
            });
        }).catch(function (error) {
            // Handle error
            console.log(error);
        });
    } else {
        alert("Sorry something went wrong. You need to login again to continue.");
        window.location = "/login";
    }
}

function confirmDelete(form) {
    if (confirm("Are you sure you want to delete this user?")) {
        post(form);
    }
}

function post(form) {
    if (firebase.auth().currentUser) {
        firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function (idToken) {
            // Send token to backend and load response
            // console.log(idToken);
            $(form).find('input[required]').each((index, element) => {
                if (!$(element).val()) {
                    console.log("EMPTY!!!!!");
                }
            });
            let formData = $(form).serialize();
            $.ajax({
                type: 'POST',
                url: $(form).attr('action'),
                data: formData,
                headers: { "Authorization": idToken },
                success: (response) => {
                    // console.log("success - " + response);
                    get('customers' + response);
                },
                error: function () {
                    alert("Error");
                }
            });
        }).catch(function (error) {
            // Handle error
            console.log(error);
        });
    } else {
        alert("Sorry something went wrong. You need to log in again to continue.");
        window.location = "/login";
    }
}