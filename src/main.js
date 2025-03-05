import './app.css'
import App from './App.svelte'
import { profile } from './config/profile'

// Pastikan struktur data sesuai
profile.set({
	name: null,
	username: null,
	password: null,
	score: 0,
	words: [],
	reports: {},
	lastUpdatedAt: new Date().toISOString(),
})

// Update reports dengan nilai default berdasarkan tanggal hari ini
profile.update((p) => {
	const today = new Date().toDateString()
	if (!p.reports[today]) {
		p.reports[today] = {
			words: [],
			score: 0,
		}
	}
	return p
})

const app = new App({
	target: document.getElementById('app'),
})

export default app
