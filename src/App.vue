<!-- <script setup>
import HelloWorld from './components/HelloWorld.vue'
</script> -->

<template>
	<!-- Header -->
    <header>
        <h1>{{ h1Tag }}</h1>
        <nav v-if="showNav">
            <ul>
                <li><a href="#home">這是什麼？</a></li>
                <li><a href="#services">服務介紹</a></li>
                <li><a href="#download">軟體下載</a></li>
                <li><a href="#contact">聯絡我們</a></li>
				<li><router-link to="/howto">教學影片</router-link></li>
            </ul>
        </nav>
        <div class="auth-buttons">
			<router-link to="/" v-if="showBackToHome">返回主畫面</router-link>
			<router-link to="/register" v-if="showRegister">註冊</router-link>
			<router-link to="/login" v-if="showLogin">登入</router-link>
			<router-link to="/editini" v-if="showEditIni">編輯我的代理</router-link>
            <a href="#" @click.prevent="logout" v-if="showLogout">登出</a>
            <button @click.prevent="deleteAccount" v-if="showDeleteAccount">刪除帳號</button>
        </div>
    </header>

	<!-- Main Content -->
	<router-view />

	<!-- <div>
		<a href="https://vite.dev" target="_blank">
		<img src="/vite.svg" class="logo" alt="Vite logo" />
		</a>
		<a href="https://vuejs.org/" target="_blank">
		<img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
		</a>
	</div>
	<HelloWorld msg="Vite + Vue" /> -->
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Cookies from 'js-cookie'

const router = useRouter()

const h1Tag = ref("")
const showNav = ref(false)
const showBackToHome = ref(true)
const showRegister = ref(true)
const showLogin = ref(true)
const showEditIni = ref(false)
const showLogout = ref(false)
const showDeleteAccount = ref(false)

const username = Cookies.get("username") || null
const password = Cookies.get("password") || null

watch(() => router.currentRoute.value, (route) => {
	const meta = route.meta || {}
	h1Tag.value = meta.h1 || "TaiwanFRP"
	showNav.value = route.path === "/"
	showBackToHome.value = route.path !== "/"

	const isLoggedIn = !username && !password
	showRegister.value = isLoggedIn && route.path !== "/register"
	showLogin.value = isLoggedIn && route.path !== "/login"

	showEditIni.value = !isLoggedIn && route.path !== "/editini"
	showLogout.value = !isLoggedIn
	showDeleteAccount.value = !isLoggedIn
})

function logout() {
	Cookies.remove("username")
	Cookies.remove("password")
	alert("登出成功")
	if (router.currentRoute.value.path === "/") {
		location.reload()
	} else {
		router.push("/")
	}
}

function deleteAccount() {
    const checkPassword = prompt("請輸入密碼以確認刪除")
    const username = Cookies.get("username")

    if (checkPassword !== Cookies.get("password")) {
        alert("密碼錯誤，無法刪除帳號")
        return
    }

    fetch(import.meta.env.VITE_API_URL + "/delete_account", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username: username, password: password})
    }).then(async (response) => {
        if (response.ok) {
            alert("帳號已成功刪除")
            logout()
            router.push("/")
        } else {
            alert("刪除帳號失敗" + await response.text())
        }
    })
}
</script>

<style scoped></style>
