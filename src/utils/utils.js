export function showMessage(message, success = false, callback = null) {
    const messageBox = document.getElementById('message-box');
    const overlay = document.getElementById('overlay');
    messageBox.innerHTML = `<p>${message}</p>`;
    if (success) {
        messageBox.innerHTML += `<button onclick="window.location.href='index.html'">確定</button>`;
    } else {
        messageBox.innerHTML += `<button onclick="hideMessage()">取消</button>`;
    }
    if (callback) {
        messageBox.innerHTML += `<button onclick="${callback}">確定</button>`;
    }
    messageBox.style.display = 'block';
    overlay.style.display = 'block';
    document.addEventListener('keydown', handleEnterKey);
}

export function hideMessage() {
    document.getElementById('message-box').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
    document.removeEventListener('keydown', handleEnterKey);
}