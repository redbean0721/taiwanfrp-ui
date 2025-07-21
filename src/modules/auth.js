// import { onMounted, onUnmounted, ref } from 'vue';
import { showMessage } from '../utils/utils';
import Cookies from 'js-cookie';

export function handleEnterKey(event) {
    if (event.key === 'Enter') {
        const button = document.querySelector('.message-box button');
        if (button) {
            button.click();
        }
    }
}

export async function logout() {
    const response = await fetch(import.meta.env.VITE_API_URL + "/logout", {
        method: "POST",
        headers: {"Content-Type": "application/json"}
    });
    if (response.ok) {
        Cookies.remove("username");
        Cookies.remove("password");
        window.location.href = "/";
    } else {
        showMessage("登出失敗，請稍後再試", false);
        console.error("Logout failed: ", response.statusText);
    }
}

export function confirmLogout() {
    const messageBox = document.getElementById('message-box');
    const overlay = document.getElementById('overlay');
    messageBox.innerHTML = `
        <p>確定要登出嗎？</p>
        <div style="margin-top: 10px;">
            <button onclick="hideMessage()" style="margin-right: 20px;">取消</button>
            <button onclick="logout()">確定</button>
        </div>
    `;
    messageBox.style.display = 'block';
    overlay.style.display = 'block';
    document.addEventListener('keydown', handleEnterKey);
}

export async function deleteAccount() {
    const username = Cookies.get("username");
    const password = Cookies.get("password");
    if (!username || !password) {
        showMessage("請先登入帳號", false);
        return;
    }
    const response = await fetch(import.meta.env.VITE_API_URL + "/delete_account", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        Cookies.remove("username");
        Cookies.remove("password");
        showMessage("帳號已成功刪除", true, "window.location.href = '/'");
    } else {
        showMessage("刪除帳號失敗: " + await response.text(), false);
        console.error("Delete account failed: ", response.statusText);
    }
}

export function confirmDeleteAccount() {
    const messageBox = document.getElementById('message-box');
    const overlay = document.getElementById('overlay');
    messageBox.innerHTML = `
        <p>確定要註銷帳號嗎？這將刪除所有代理和端口，無法復原。</p>                <div style="margin-top: 10px;">
            <label for="delete-password">請輸入密碼確認:</label>
        </div>
        <div style="margin-top: 10px;">
            <input type="password" id="delete-password" name="delete-password" required>
        </div>
        <div style="margin-top: 10px;">
            <button onclick="hideMessage()" style="margin-right: 20px;">取消</button>
            <button onclick="deleteAccount()">確定</button>
        </div>
    `;
    messageBox.style.display = 'block';
    overlay.style.display = 'block';
    document.addEventListener('keydown', handleEnterKey);
}