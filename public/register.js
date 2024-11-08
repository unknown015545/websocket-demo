function register() {
    var username = document.getElementById("username")
    var password = document.getElementById("password")
    fetch("/api/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
          },
        body: JSON.stringify({
            username: username.value,
            password: password.value
        })
    }).then((data) => {
        data.json().then((json) => {
            if(json.ok) {
                window.location.replace("/")
            } else {
                alert("INVALID!!!")
            }
        })
    })  
}