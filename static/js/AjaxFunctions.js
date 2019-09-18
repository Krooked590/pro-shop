// function displayCustomers() {
//     if (firebase.auth().currentUser) {
//         firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function (idToken) {
//             // Send token to backend and load response
//             // console.log(idToken);
//             $.ajax({
//                 url: '/customers',
//                 type: 'get',
//                 dataType: 'html',
//                 headers: { 'Authorization': idToken },
//                 success: function (html) {
//                     history.pushState({}, 'Customers', '/customers');
//                     $("#content").html(html);
//                 },
//                 error: function () {
//                     alert("Error");
//                 }
//             });
//         }).catch(function (error) {
//             // Handle error
//             console.log(error);
//         });
//     } else {
//         toggleSignIn();
//     }
// }