<template>
    <section>
        <h2>Windows 架設 Minecraft 伺服器教學</h2>
        <div class="video-container">
            <iframe src="https://www.youtube.com/embed/enPVl-_HLV8" frameborder="0" allowfullscreen></iframe>
        </div>
    </section>

    <section>
        <h2>macOS 架設 Minecraft 伺服器教學</h2>
        <div class="video-container">
            <iframe src="https://www.youtube.com/embed/vzbYX3olqn8" frameborder="0" allowfullscreen></iframe>
        </div>
    </section>

    <section>
        <h2>Linux 架設 Minecraft 伺服器教學</h2>
        <p style="text-align: center;">Linux 沒有教學影片。我相信 Linux 的用戶都是高手會用這套軟體，不會的可以參考 macOS 的教學。</p>
    </section>

    <div id="message-box" class="message-box"></div>
    <div id="overlay" class="overlay"></div>
</template>

<style scoped>
.video-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 20px;
}

.video-container iframe {
	width: 80%;
	max-width: 800px;
	height: 450px;
}
</style>
