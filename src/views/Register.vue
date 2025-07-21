<template>
    <section>
        <form @submit.prevent="register">
            <label for="username">使用者名稱:</label>
            <input type="text" id="username" v-model="username" autocomplete="username" required><br><br>
            <label for="password">密碼:</label>
            <input type="password" id="password" v-model="password" autocomplete="new-password" required><br><br>
            <label for="verificationCode">驗證碼:</label>
            <input type="text" id="verificationCode" v-model="verificationCode" autocomplete="one-time-code" required><br><br>

            <button type="button" @click="openDiscord">進入 Discord 獲取驗證碼</button>

            <p>請進入 <a href="https://discord.gg/ueGFVVHp85" target="_blank">Discord</a> 獲取驗證碼。進入之後到頻道▘註冊使用者帳號▗點擊點擊按鈕獲取。一位 Discord 使用者只能註冊一個帳號。</p>
            <div style="margin: 10px 0; display: flex; align-items: center;">
                <input type="checkbox" id="agreeTerms" v-model="agreeTerms" autocomplete="one-time-code" class="checkbox-terms">
                <label for="agreeTerms" style="margin: 0;">我已詳細閱讀並同意 <router-link to="/terms">使用者協議</router-link></label>
            </div>
            <button type="submit">註冊</button>
        </form>

        <p>已經有帳號？ <router-link to="/login">點擊這裡登入</router-link></p>
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

const username = ref("")
const password = ref("")
const verificationCode = ref("")
const agreeTerms = ref(false)

const usernameRegex = new RegExp(import.meta.env.VITE_USERNAME_REGEX)
const passwordRegex = new RegExp(import.meta.env.VITE_PASSWORD_REGEX)
const verificationCodeRegex = new RegExp(import.meta.env.VITE_VERIFICATION_CODE_REGEX)

function openDiscord() {
    window.open("https://discord.gg/ueGFVVHp85", "_blank");
}

async function register() {
    if (!agreeTerms.value) {
        alert("請先閱讀並同意使用者協議")
        return
    }

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
    if (!verificationCodeRegex.test(verificationCode.value)) {
        alert("驗證碼格式不正確，請使用6位的字母或數字")
        return
    }

    try {
        const response = await fetch(import.meta.env.VITE_API_URL + "/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: username.value,
                password: password.value,
                verificationCode: verificationCode.value
            })
        })

        if (response.ok) {
            alert("註冊成功，歡迎加入TaiwanFRP！")
            router.push("/login");
        } else {
            alert("註冊失敗，請聯絡管理員")
            console.error("Registration failed:", response.status, response.statusText);
        }
    } catch (err) {
        alert("請求錯誤，請稍後再試")
        console.error("Request error:", err);
    }
}
</script>

<style scoped>
.checkbox-terms {
    width: auto;
    margin: 0 6px 0 0;
    accent-color: #ffbf00;
    cursor: pointer;
}
</style>
