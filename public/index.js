const socket = io();
var creds;
function sendMessage() {
    var message = document.getElementById("message")
    socket.emit("message", {
        message: message.value
    })
    message.value = ""
}
function signIn() {
    var username = document.getElementById("username")
    var password = document.getElementById("password")

    fetch("/api/signin", {
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
            if (json.in) {
                creds = {
                    username: username.value,
                    password: password.value
                }
                document.getElementById("login").style.display = "none"
                document.getElementById("interface").style.display = "block"
                socket.emit("login", {
                    username: username.value,
                    password: password.value
                })

                fetch("/api/messages", {
                    method: "POST",
                    headers:
                    {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: username.value,
                        password: password.value
                    })
                }).then((data) => {
                    data.json().then((json) => {
                        if (!json.in) {
                            alert("INVALID!!!")
                            return
                        }
                        json.messages.map((msg) => {
                            var messages = document.getElementById("messages")
                            var item = document.createElement("li")
                            item.setAttribute("data-msg-id", msg.id)
                            if (creds.username == msg.username) {
                                var button = document.createElement("button")
                                button.setAttribute('data-message-id', msg.id)
                                button.onclick = () => {
                                    var id = msg.id
                                    fetch("/api/deleteMessage", {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json"
                                        }, body: JSON.stringify({
                                            id,
                                            username: creds.username,
                                            password: creds.password
                                        })
                                    }).then((data) => {
                                        data.json().then((json) => {
                                            if (!json.in) {
                                                alert("Cannot delete message!")
                                            }
                                        })
                                    })
                                }
                                button.innerText = "delete"
                                item.innerText = `${msg.username}: ${msg.message}`
                                item.appendChild(button)
                            } else {
                                item.innerText = `${msg.username}: ${msg.message}`
                            }
                            messages.appendChild(item)
                        })
                    })
                })
            } else {
                alert("Username or password is invalid!")
            }
        })
    })
}

socket.on('message', (msg) => {
    var messages = document.getElementById("messages")
    var item = document.createElement("li")
    item.setAttribute("data-msg-id", msg.id)
    if (creds.username == msg.username) {
        var button = document.createElement("button")
        button.setAttribute('data-message-id', msg.id)
        button.onclick = () => {
            var id = msg.id
            fetch("/api/deleteMessage", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }, body: JSON.stringify({
                    id,
                    username: creds.username,
                    password: creds.password
                })
            }).then((data) => {
                data.json().then((json) => {
                    if (!json.in) {
                        alert("Cannot delete message!")
                    }
                })
            })
        }
        button.innerText = "delete"
        item.innerText = `${msg.username}: ${msg.message}`
        item.appendChild(button)
    } else {
        item.innerText = `${msg.username}: ${msg.message}`
    }
    messages.appendChild(item)
})
socket.on("loginresponse", (response) => {
    if (!response.ok) {
        alert("Invalid!!!")
        location.reload()
    }
})

socket.on("deleteMessage", (id) => {
    var message = document.querySelectorAll(`[data-msg-id='${id}']`)[0]
    message.remove()
})