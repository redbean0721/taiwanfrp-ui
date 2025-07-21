import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
	plugins: [vue()],
	server: {
		host: "0.0.0.0",
		allowedHosts: ["vue.redbean0721.com"],
		watch: {
		ignored: [
			'**/test/**',
			'**/other/**'
		]
		}
	},
})
