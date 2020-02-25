function searchCustomers() {
    var search = document.getElementById("searchBox").value.toLowerCase();
    var customersListItems = document.getElementsByClassName("listItemName");
    for (var i = 0; i < customersListItems.length; i++) {
        if (search == "") {
            customersListItems[i].parentNode.parentNode.removeAttribute("hidden");
        } else if (!customersListItems[i].innerText.toLowerCase().includes(search)) {
            customersListItems[i].parentNode.parentNode.setAttribute("hidden", true);
        } else {
            customersListItems[i].parentNode.parentNode.removeAttribute("hidden");
        }
    }
}

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
            let $form = $(form);
            let valid = true;
            let edit = false;

            //if we came from show page
            $form.find("#firstName, #lastName, #phoneNumber, #email").each((index, element) => { 
                edit = true;
                let $element = $(element);
                if (element.id === "firstName") {
                    $form.find("#hiddenFirst").eq(0).val($element.text());
                } else if (element.id === "lastName") {
                    $form.find("#hiddenLast").eq(0).val($element.text());
                } else if (element.id === "phoneNumber") {
                    $form.find("#hiddenPhone").eq(0).val($element.text());
                } else if (element.id === "email") {
                    $form.find("#hiddenEmail").eq(0).val($element.text());
                }
            });

            $form.find("input, textarea").each((index, element) => {
                let $element = $(element);
                if ($element.prop('required') && !$element.val()) {
                    valid = false;
                } else if (!$element.val()) {
                    let name = $element.attr("name");
                    if (name.includes("layout")) {
                        $element.val("0");
                    }
                }
            });

            if (!valid) {
                alert("please fill out the required fields");
                return;
            }

            let formData = $form.serialize();
            $.ajax({
                type: 'POST',
                url: $form.attr('action'),
                data: formData,
                headers: { "Authorization": idToken },
                success: (response) => {
                    // console.log("success - " + response);
                    get('customers' + response);
                    if (edit) {
                        showAlert(document.getElementById("alertSuccess"));
                    }
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