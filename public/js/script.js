document.addEventListener('DOMContentLoaded', function () {
    // executing the script conditionally based on which page is loaded
    if (pageType === 'home') {
        // Home page entry form elements
        const userNameInputEle = document.querySelector('#userName');
        const entryFormEle = document.querySelector('#entry-form');
        entryFormEle.addEventListener('submit', (event) => {
            event.preventDefault();
            userName = userNameInputEle.value;
            if (userName) {
                // redirecting to the chat page
                window.location.href = `/chat?userName=${userName}`;
            }
        });
    } else if (pageType === 'chat') {
        // loading socket library on client side 
        const socket = io.connect();
        // retrieving the userName from query paramater
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const userName = urlParams.get('userName');
        // online users
        const onlineContainerEle = document.querySelector('#online-container');
        // chat display elements
        const messageDisplayEle = document.querySelector('.message-display');
        const typingAlertEle = document.querySelector('#typing');
        const userNameEle = document.querySelector('#user');
        const userAlertEle = document.querySelector('#user-joined');
        const messageInputEle = document.querySelector('#message');
        const chatinputFormEle = document.querySelector('#chat-input');

        // emit user-joined event
        socket.emit('user-joined', { userName });

        // loading chat history
        socket.on('previousMessages', (previousMessages) => {
            previousMessages.forEach(msg => {
                const timestamp = formatDate(msg.createdAt);
                const messageContainerDiv = document.createElement('div');
                if (msg.userName === userName) {
                    messageContainerDiv.classList.add('message-container', 'right');
                    messageContainerDiv.innerHTML = `<div class="message">
                            <div class="timestamp"><span class="name">${msg.userName} </span> ${timestamp}</div>
                            <div class="message-text">${msg.message}</div>
                        </div>
                        <div class="profile-picture">${msg.userName[0].toUpperCase()}</div>`
                    messageDisplayEle.appendChild(messageContainerDiv);
                } else {
                    messageContainerDiv.classList.add('message-container');
                    messageContainerDiv.innerHTML = `<div class="profile-picture">${msg.userName[0].toUpperCase()}</div>
                        <div class="message">
                            <div class="timestamp"><span class="name">${msg.userName} </span> ${timestamp}</div>
                            <div class="message-text">${msg.message}</div>
                        </div>`
                    messageDisplayEle.appendChild(messageContainerDiv);
                }
            });
            // displaying the user name
            userNameEle.textContent = userName.toUpperCase();
            messageDisplayEle.scrollTop = messageDisplayEle.scrollHeight;
        });

        // listening to alert event for greet and new user notification
        socket.on('alert', (alert, onlineUsers) => {
            const alertDiv = document.createElement('div');
            alertDiv.textContent = alert.text;
            userAlertEle.innerHTML = '';
            userAlertEle.appendChild(alertDiv);
            // notification sound
            playNotificationSound('../audio/alert.wav');
            setTimeout(() => {
                alertDiv.remove();
            }, 5000);
            // Render the list of online users
            displayOnlineUsers(onlineUsers);
        });

        // typing indicator feature
        messageInputEle.addEventListener('input', () => {
            socket.emit('typing', userName);
        });
        // listening to userTyping event from socket server
        socket.on('userTyping', (typingAlert) => {
            const typingAlertDiv = document.createElement('div');
            typingAlertDiv.textContent = typingAlert.text;
            typingAlertEle.innerHTML = '';
            typingAlertEle.appendChild(typingAlertDiv);
            setTimeout(() => {
                typingAlertDiv.remove();
            }, 2000);
        });
        // listening to userLeft event from socket server
        socket.on('userLeft', (alert, onlineUsers) => {
            const alertDiv = document.createElement('div');
            alertDiv.textContent = alert.text;
            userAlertEle.innerHTML = '';
            userAlertEle.appendChild(alertDiv);
            // notification sound
            playNotificationSound('../audio/alert.wav');
            setTimeout(() => {
                alertDiv.remove();
            }, 5000);
            // Render the list of online users
            displayOnlineUsers(onlineUsers);
        });

        // listening to beforeunload, to cleanup things when user leaves
        window.addEventListener('beforeunload', (event)=>{
            // event.preventDefault();
            socket.emit('userLeft', userName);
        });

        // send message
        chatinputFormEle.addEventListener('submit', (event) => {
            event.preventDefault();
            const message = messageInputEle.value.trim();
            messageInputEle.value = '';
            if (message) {
                socket.emit('sendMessage', { userName, message });
            }
        });
        // listening to receivedMessage event from socket server
        socket.on('receivedMessage', (newMessage) => {
            const messageContainerDiv = document.createElement('div');
            const timestamp = formatDate(newMessage.createdAt);
            if (newMessage.userName === userName) {
                messageContainerDiv.classList.add('message-container', 'right');
                messageContainerDiv.innerHTML = `<div class="message">
                            <div class="timestamp"><span class="name">${newMessage.userName} </span> ${timestamp}</div>
                            <div class="message-text">${newMessage.message}</div>
                        </div>
                        <div class="profile-picture">${newMessage.userName[0].toUpperCase()}</div>`
                messageDisplayEle.appendChild(messageContainerDiv);
            } else {
                messageContainerDiv.classList.add('message-container');
                messageContainerDiv.innerHTML = `<div class="profile-picture">${newMessage.userName[0].toUpperCase()}</div>
                        <div class="message">
                            <div class="timestamp"><span class="name">${newMessage.userName} </span> ${timestamp}</div>
                            <div class="message-text">${newMessage.message}</div>
                        </div>`
                messageDisplayEle.appendChild(messageContainerDiv);
            }
            messageDisplayEle.scrollTop = messageDisplayEle.scrollHeight;
            // notification sound
            playNotificationSound('../audio/send-msg.mp3');
        });

        // render the list of online users
        function displayOnlineUsers(onlineUsers) {
            onlineContainerEle.innerHTML = '';
            onlineUsers.forEach(user => {
                const userDiv = document.createElement('div');
                userDiv.innerHTML = `${user.userName} <i class="fa-solid fa-circle-dot"></i>`
                onlineContainerEle.appendChild(userDiv);
            });
        }

        // to format the date to display in chat
        function formatDate(date) {
            const dateObj = new Date(date);
            const days = String(dateObj.getDate()).padStart(2, '0');
            const months = String(dateObj.getMonth() + 1).padStart(2, '0'); // Months are zero-based
            const years = dateObj.getFullYear();
            let hours = dateObj.getHours();
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            const formattedHours = String(hours).padStart(2, '0');
            return `${days}/${months}/${years} ${formattedHours}:${minutes} ${ampm}`;
        }

        function playNotificationSound(url) {
            const audio = new Audio(url);
            audio.play();
        }

        // error handling
        socket.on("connect_error", (err) => {
            // the reason of the error, for example "xhr poll error"
            console.log(err.message);

            // some additional description, for example the status code of the initial HTTP response
            console.log(err.description);

            // some additional context, for example the XMLHttpRequest object
            console.log(err.context);
        });
    }
});
