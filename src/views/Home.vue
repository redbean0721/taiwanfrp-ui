<template>
	<!-- Server Status Section -->
	<section id="server-status-section">
		<h2 style="color: black;">內網穿透伺服器狀態</h2>
		<div class="server-status-table-container">
			<div id="taiwanfrp-status" class="server-status-container">
				<!-- TaiwanFRP service status will be dynamically loaded here -->
			</div>
			<table class="server-status-table">
				<thead>
					<tr>
						<th>伺服器名稱</th>
						<th>狀態</th>
					</tr>
				</thead>
				<tbody id="server-status-list">
					<!-- Server status will be populated here -->
				</tbody>
				<!-- <div id="taiwanfrp-status" class="server-status-container"> -->
					<!-- TaiwanFRP service status will be dynamically loaded here -->
				<!-- </div> -->
			</table>
		</div>
		<a :href="`${howToChoose}`" target="_blank" class="howToChoose">該選哪個？</a>
	</section>

    <!-- Tunnel List Section -->
    <section ref="tunnelListSection" style="display: none;">
        <h2>我的代理狀態</h2>
        <div id="discord-status" class="discord-status">
            偵測到未加入 Discord，請及時加入，否則將無法啟動代理！
            <button onclick="window.open('https://discord.gg/ueGFVVHp85', '_blank')">加入 Discord</button>
        </div>
        <div id="account-expired-status" class="discord-status">
            帳號已經到期，無法啟動代理！請聯絡 TaiwanFRP
            <button onclick="window.open('https://discord.gg/PcWgJf3txz', '_blank')">聯絡我們</button>
        </div>
        <p id="current-username"></p>
        <div ref="tunnelList"></div>
        <p ref="noTunnelMessage" class="no-tunnel-message" style="display: none;">當前還沒有代理，點擊右上角 "編輯我的代理" 來新增代理。</p>
    </section>

    <!-- Home Section -->
    <section id="home">
        <h2>TaiwanFRP</h2>
        <h2>免費內網穿透服務</h2>
        <p>透過 FRP 提供的內網穿透節點，幫助您輕鬆架設伺服器。</p>
        <p>無需設定路由器，簡化所有操作，只需註冊一個帳號，創建一個代理，即可輕鬆架設 Minecraft 伺服器，在你自己的電腦上。</p>
        <p style="font-weight: bold;">想要了解如何架設Minecraft伺服器嗎？請查看我們的 <router-link to="/howto" style="color: #1fb032;">教學影片</router-link>。</p>
    </section>

    <!-- Services Section -->
    <section id="services">
        <h2>服務特色</h2>
        <p>我們的服務不是通過 VPN，只需在服務端設定，客戶端無須安裝任何軟體即可連線，效果如同設定好路由器。</p>
        <p>這是一個免費的服務，專為家中沒有公網的人設計。無論您使用的是 4G 或 5G 行動網路，還是台灣大寬頻等家庭網路，只要有網路連線，就可以輕鬆架設伺服器，無需擔心防火牆設置。</p>
        <p>我們的主要服務是 Minecraft 伺服器，但您也可以用它來架設其他任何基於 TCP 或 UDP 協議的伺服器。只需添加代理設置，即可同時轉發 TCP 和 UDP 流量，確保您的伺服器穩定運行。</p>
        <p style="color: red;">請注意，所有伺服器都是運行在您的電腦上，而不是運行在我們的伺服器上。我們僅提供內網穿透服務，幫助您將本地伺服器公開到網路。</p>
    </section>

    <!-- Software Download Section -->
    <section id="download">
        <h2>軟體下載</h2>
        <p>選擇您的作業系統下載對應的軟體版本。</p>
        <div class="download-buttons">
            <a href="https://taiwanfrp.ddns.net/windows/taiwanfrp.exe">Windows</a>
            <a href="https://taiwanfrp.ddns.net/linux/taiwanfrp">Linux(ARM)</a>
            <a href="https://taiwanfrp.ddns.net/linuxX86/taiwanfrp">Linux(x86_64)</a>
            <a href="https://taiwanfrp.ddns.net/macos/taiwanfrp">macOS</a>
        </div>
        <p>Linux 和 macOS 腳本下載完畢之後，請先 cd 到該目錄下執行 <code>chmod +x taiwanfrp</code> 再執行 <code>./taiwanfrp</code>。</p>
        <p style="color: red;">*軟體需搭配帳號使用，請先 <router-link to="/register" style="color: rgb(106, 106, 234);">註冊帳號</router-link> *</p>
    </section>

        <!-- 成為合作夥伴 -->
        <section id="download">
            <h2>成為 TaiwanFRP 合作夥伴</h2>
            <p>將您的 FRP 伺服器通過 TaiwanFRP 發揚光大！</p>
            <div class="download-buttons">
				<router-link to="/partner">開始申請！</router-link>
            </div>
        </section>

    <!-- Contact Section -->
    <section id="contact" style="text-align: left;">
        <h2>聯絡我們</h2>
        <p>電子郵件: <a href="mailto:kiwi071294@gmail.com" style="color: black;">kiwi071294@gmail.com</a></p>
        <p>Discord 群組: <a href="https://discord.gg/83AFn92DbX" target="_blank" rel="noopener noreferrer" style="color: black;" title="加入我們的 Discord">加入我們的 Discord</a></p>
    </section>

    <!-- Footer -->
    <footer style="background-color: rgba(255, 255, 255, 0.7); /* 白色背景透明度為0.7 */">
        <p style="color: white;">powered by kiwi071294</p>
        <button onclick="window.location.href='admin'" style="background: none; border: none; color: #ccc; cursor: pointer; font-size: 12px; display: block; margin-top: 10px;">管理員中心</button>
    </footer>

    <div id="message-box" class="message-box"></div>
    <div id="overlay" class="overlay"></div>
	<img src="/terms.png" alt="隱私權圖標" ref="privacyIcon" id="privacy-icon" class="terms" @click="goTerms" />

</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { goTerms, initPrivacyIcon, destroyPrivacyIcon } from '../modules/privacy';
import { renderTaiwanFRPStatus } from '../modules/serverStatus';
import { Chart } from 'vue-chartjs';
import Cookies from 'js-cookie';

const privacyIcon = ref(null)

// const howToChoose = import.meta.env.VITE_API_URL + ":8000/whatmybestchooise.html"
const howToChoose = "http://taiwanfrp.ddns.net:8000/whatmybestchooise.html"

onMounted(() => {
	initPrivacyIcon(privacyIcon)

	renderTaiwanFRPStatus()
	// setInterval(renderTaiwanFRPStatus, 5000)
})

onUnmounted(() => {
	destroyPrivacyIcon()
})
</script>

<style>
html {
	scroll-behavior: smooth;	 /* 平滑滾動 */
}

header {
	animation: fadeIn 1s ease-in-out;
}

nav ul {
	list-style: none;
	padding: 0;
	margin: 0;
	display: flex;
	justify-content: center; /* 置中導覽列 */
	align-items: center; /* 垂直置中項目 */
	animation: slideIn 1s ease-in-out;
	flex-wrap: nowrap; /* 防止換行 */
	overflow-x: hidden; /* Prevent horizontal scroll */
}

nav ul li {
	display: inline;
	margin-right: 20px;
	white-space: nowrap; /* 防止文字換行 */
}

nav ul li:last-child {
	margin-right: 0; /* 移除最後一項的間距 */
}

nav ul li a {
	color: #ffbf00; /* 橙黃色 */
	text-decoration: none;
	font-weight: bold;
	font-size: calc(11px + 0.5vw); /* 根據螢幕大小調整字體大小 */
	user-select: none; /* 防止文字選取 */
	max-width: 100%; /* Ensure text fits within the div */
	overflow: hidden; /* Prevent text overflow */
	text-overflow: ellipsis; /* Add ellipsis for overflow text */
}

nav ul li a:hover,
nav ul li a:focus {
	color: white; /* 滑鼠懸停時的顏色 */
}

section {
	animation: fadeInUp 1s ease-in-out;
}

h2 {
	animation: fadeInDown 1s ease-in-out;
}

.download-buttons {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
}

.download-buttons a {
	color: black;
	background-color: #ffbf00;
	padding: 10px 20px;
	border-radius: 5px;
	text-decoration: none;
	margin: 5px;
	width: 30%; /* 確保按鈕寬度一致 */
	text-align: center;
	animation: fadeIn 1.5s ease-in-out;
}

.howToChoose {
	margin-left: 10px;
	color: #007bff;
	text-decoration: underline;
	font-size: 14px;
	vertical-align: middle;
	display: inline-block;
	margin-top: 8px;
}

@keyframes fadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
}

@keyframes fadeInUp {
	from { opacity: 0; transform: translateY(20px); }
	to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInDown {
	from { opacity: 0; transform: translateY(-20px); }
	to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
	from { opacity: 0; transform: translateX(-20px); }
	to { opacity: 1; transform: translateX(0); }
}

.tunnel-item {
	background-color: #f0f0f0;
	border-radius: 8px;
	padding: 10px;
	margin-bottom: 10px;
	color: #333;
}

.tunnel-item strong {
	color: #ffbf00;
}

.tunnel-item p {
	margin: 5px 0;
}

.tunnel-status {
	padding: 10px;
	border-radius: 5px;
	margin-bottom: 10px;
}

input {
	width: calc(100% - 22px);
	padding: 10px;
	margin-bottom: 10px;
	border: 1px solid #ccc;
	border-radius: 5px;
}

.tunnel-status-online {
	background-color: #d4edda;
	color: #155724;
}

.tunnel-status-offline {
	background-color: #f8d7da;
	color: #721c24;
}

.tunnel-status p {
	margin: 0;
}

.tunnel-status-online {
	color: green;
}

.tunnel-status-offline {
	color: red;
}

.no-tunnel-message {
	color: black;
	font-size: 16px;
	margin-top: 20px;
}

.tunnel-table-container {
	overflow-x: auto;
}

.tunnel-table {
	width: 100%;
	border-collapse: collapse;
	margin: 20px 0;
	min-width: 600px; /* Ensure table doesn't shrink too much */
}

.tunnel-table th, .tunnel-table td {
	border: 1px solid #ddd;
	padding: 8px;
	text-align: center;
}

.tunnel-table th {
	background-color: #f2f2f2;
	color: #333;
}

.tunnel-status-icon {
	width: 20px;
	height: 20px;
	vertical-align: middle;
	border-radius: 50%;
	display: inline-block;
}

.tunnel-status-online .tunnel-status-icon {
	background-color: green;
}

.tunnel-status-offline .tunnel-status-icon {
	background-color: red;
}

.promo-section {
	text-align: center;
	background-color: rgba(255, 255, 255, 0.9);
	padding: 40px 20px;
	margin: 20px;
	border-radius: 8px;
	box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
	animation: fadeIn 1s ease-in-out;
}

.promo-section h2 {
	color: #ffbf00;
	margin-bottom: 20px;
}

.promo-section p {
	color: #333;
	font-size: 18px;
	margin-bottom: 20px;
}

.promo-buttons {
	display: flex;
	justify-content: center;
	gap: 20px;
}

.promo-buttons a {
	color: white;
	background-color: #ffbf00;
	padding: 15px 30px;
	border-radius: 5px;
	text-decoration: none;
	font-size: 18px;
	font-weight: bold;
	animation: fadeIn 1.5s ease-in-out;
}

.promo-buttons a:hover,
.promo-buttons a:focus {
	background-color: #e6ac00;
}

.server-status-online {
	color: green;
}

.server-status-offline {
	color: red;
}

.server-status-table-container {
	overflow-x: hidden; /* Prevent horizontal scroll */
	white-space: normal; /* Allow text to wrap */
}

.server-status-table {
	width: 100%;
	border-collapse: collapse;
	margin: 20px 0;
}

.server-status-table td {
	color: black; /* Make text under "伺服器名稱" black */
}

.server-status-table th, .server-status-table td {
	border: 1px solid black;
	padding: 8px;
	text-align: center;
}

.server-status-table th {
	background-color: #f2f2f2;
	color: #333;
}

.server-status-icon {
	width: 20px;
	height: 20px;
	vertical-align: middle;
	border-radius: 50%;
	display: inline-block;
}

.server-status-online .server-status-icon {
	background-color: green;
}

.server-status-offline .server-status-icon {
	background-color: red;
}

.discord-status {
	display: none;
	color: red;
	background-color: rgba(255, 0, 0, 0.1);
	padding: 15px;
	border-radius: 8px;
	margin-bottom: 20px;
	text-align: center;
	font-weight: bold;
}

.discord-status button {
	background-color: #ffbf00;
	color: #333;
	padding: 10px 20px;
	border: none;
	border-radius: 5px;
	cursor: pointer;
	font-size: calc(10px + 0.5vw);
	margin-top: 10px;
}

.discord-status button:hover,
.discord-status button:focus {
	background-color: #e6ac00;
	color: white;
}

#tunnel-list-section {
	word-wrap: break-word; /* Ensure long words break properly */
	white-space: normal; /* Allow text wrapping */
}

.tunnel-table-container {
	overflow-x: auto; /* Enable horizontal scrolling for smaller screens */
}

.tunnel-table th, .tunnel-table td {
	word-break: keep-all; /* Prevent breaking words unnecessarily */
	white-space: nowrap; /* Prevent text from wrapping prematurely */
}

@media (max-width: 768px) {
	.tunnel-table th, .tunnel-table td {
		font-size: 12px; /* Adjust font size for smaller screens */
		padding: 6px; /* Reduce padding for better fit */
	}
}

.runid-container {
	border: 2px solid #04ff00;
	border-radius: 8px;
	padding: 15px;
	margin-bottom: 20px;
	background-color: rgba(0, 255, 0, 0.1);
	font-family: 'Courier New', Courier, monospace; /* Monospace font for tree structure */
}

.offline-container {
	border: 2px solid #ff0000;
	border-radius: 8px;
	padding: 15px;
	margin-bottom: 20px;
	background-color: rgba(255, 0, 0, 0.1);
	font-family: 'Courier New', Courier, monospace;
}

.runid-title, .offline-status {
	font-size: 18px;
	margin-bottom: 10px;
}

.runid-title {
	color: #ffa500;
	font-weight: bold;
}

.offline-status {
	color: #ff0000;
	font-weight: bold;
}

.tree-container {
	display: flex;
	flex-direction: column;
	align-items: center; /* Center horizontally */
	justify-content: center; /* Center vertically */
	gap: 10px;
	font-size: 16px;
	line-height: 1.8;
	text-align: center; /* Ensure text alignment is centered */
}

.tree-node {
	display: flex;
	align-items: center;
	gap: 5px;
	cursor: pointer; /* Add pointer cursor for clickable nodes */
}

.tree-branch {
	border-left: 2px solid #ccc;
	margin-left: 10px;
	padding-left: 10px;
}

.tree-icon {
	width: 10px;
	height: 10px;
	border-radius: 50%;
}

.tree-icon.online {
	background-color: green;
}

.tree-icon.offline {
	background-color: red;
}

.tree-label {
	font-weight: bold;
}

.tree-protocols {
	font-size: 14px;
	color: #555;
}

.popup {
	position: absolute;
	background-color: rgba(255, 255, 255, 0.9);
	color: #333;
	padding: 15px;
	border-radius: 8px;
	box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
	z-index: 1002;
	display: none;
}

.server-status-table {
	width: 100%;
	border-collapse: collapse;
	margin: 20px 0;
	font-size: 16px;
	text-align: left;
	color: black; /* Black text for better readability */
}

.server-status-table th, .server-status-table td {
	border: 1px solid black;
	padding: 8px;
}

.server-status-table th {
	background-color: #f2f2f2;
	color: #333; /* Darker text for headers */
	font-weight: bold;
}

.server-status-table tr:nth-child(even) {
	background-color: #f9f9f9; /* Light gray for even rows */
}

.server-status-table tr:hover {
	background-color: #f1f1f1; /* Highlight row on hover */
}

.server-status-container {
	margin-top: 20px;
	padding: 15px;
	border-radius: 8px;
	background-color: rgba(120, 120, 120, 0.9); /* Slightly transparent white background */
	box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); /* Subtle shadow for depth */
}

.server-status-container p {
	color: white;
}

.terms {
	position: absolute;
	right: 24px;
	bottom: 80px;
	z-index: 9999;
	width: 56px;
	height: 56px;
	cursor: pointer;
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0,0,0,0.15);
	background: white;
	padding: 6px;
	transition: top 0.7s cubic-bezier(0.4,0,0.2,1), left 0.7s cubic-bezier(0.4,0,0.2,1);
}
</style>