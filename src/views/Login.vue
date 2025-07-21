<template>
    <section v-show="showLoginSection" id="login-section">
        <form @submit.prevent="login">
            <label for="username">使用者名稱:</label>
            <input type="text" id="username" v-model="username" autocomplete="username" required><br><br>
            <label for="password">密碼:</label>
            <input type="password" id="password" v-model="password" autocomplete="current-password" required><br><br>
            <button type="submit">登入</button>
        </form>
        <a href="#" @click.prevent="showForgotPassword">忘記密碼?</a>
        <p style="color: black;">還沒有帳號？ <router-link to="/register">點擊這裡註冊</router-link></p>
    </section>

    <!-- 忘記密碼 -->
    <section v-show="!showLoginSection" id="forgot-password-section">
        <form @submit.prevent="requestPasswordReset">
            <label for="reset-username">使用者名稱:</label>
            <input type="text" id="reset-username" v-model="resetUsername" autocomplete="username" required /><br /><br />
            <button type="submit">發送驗證碼</button>
        </form>
        <form @submit.prevent="resetPassword">
            <label for="reset-code">請輸入驗證碼:</label>
            <input type="text" id="reset-code" v-model="resetCode" autocomplete="one-time-code" required /><br /><br />
            <label for="new-password">請輸入新密碼:</label>
            <input type="password" id="new-password" v-model="newPassword" autocomplete="new-password" required /><br /><br />
            <button type="submit">重置密碼</button>
        </form>
        <button @click="showLogin" style="margin-top: 10px;">回到登入</button>
    </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Cookies from 'js-cookie';

const router = useRouter()

onMounted(() => {
    if (Cookies.get("username") && Cookies.get("password")) {
        router.push("/");
    }
})

// 基本資料
const username = ref("")
const password = ref("")
const resetUsername = ref("")
const resetCode = ref("")
const newPassword = ref("")
const showLoginSection = ref(true)

const usernameRegex = new RegExp(import.meta.env.VITE_USERNAME_REGEX)
const passwordRegex = new RegExp(import.meta.env.VITE_PASSWORD_REGEX)
const verificationCodeRegex = new RegExp(import.meta.env.VITE_VERIFICATION_CODE_REGEX)

function showForgotPassword() {
    showLoginSection.value = false
}

function showLogin() {
    showLoginSection.value = true
}

async function login() {
    // 驗證使用者名稱
    if (!usernameRegex.test(username.value)) {
        alert("使用者名稱格式不正確，請使用4-64位的字母或數字")
        return
    }

    // 驗證密碼格式
    if (!passwordRegex.test(password.value)) {
        alert("密碼格式不正確，請使用6-64位的字母、數字或特殊字符")
        return
    }

    // 驗證驗證碼格式
    if (!verificationCodeRegex.test(resetCode.value) && !showLoginSection) {
        alert("驗證碼格式不正確，請使用6位的字母或數字")
        return
    }

    try{
        const response = await fetch(import.meta.env.VITE_API_URL + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: username.value,
                password: password.value
            })
        })

        if (response.ok) {
            Cookies.set("username", username.value, { path: "/" })
            Cookies.set("password", password.value, { path: "/" })
            // Cookies.remove("admin_verification_code", { path: "/" })
            // Cookies.remove("adminchanguser", { path: "/" })
            alert(`登入成功，歡迎 ${username.value} 回來 TaiwanFRP！`)
            router.push("/")
            location.reload() // 重新載入頁面以清除狀態
        } else {
            alert("登入失敗，請檢查您的使用者名稱和密碼是否正確")
            console.error("Login failed:", response.status, response.statusText);
        }
    } catch (err) {
        alert("請求錯誤，請稍後再試")
        console.error("Request error:", err);
    }
}

async function requestPasswordReset() {
    const response = await fetch(import.meta.env.VITE_API_URL + "/request_password_reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: resetUsername.value })
    })

    if (response.ok) {
        alert("驗證碼已發送到您的 Discord")
    } else {
        alert("發送驗證碼失敗，請檢查您的使用者名稱是否正確")
        console.error("Request password reset failed:", response.status, response.statusText);
    }
}

async function resetPassword() {
    const response = await fetch(import.meta.env.VITE_API_URL + "/reset_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: resetUsername.value,
            code: resetCode.value,
            newPassword: newPassword.value
        })
    })

    if (response.ok) {
        alert("密碼重置成功，請重新登入")
        location.reload() // 重新載入頁面以清除狀態
        // showLoginSection.value = true
    } else {
        alert("重置密碼失敗，請檢查您的使用者名稱和驗證碼是否正確")
        console.error("Reset password failed:", response.status, response.statusText);
    }
}
</script>