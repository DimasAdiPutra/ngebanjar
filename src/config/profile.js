import {
	addDoc,
	collection,
	doc,
	getDocs,
	query,
	setDoc,
	updateDoc,
	where,
} from 'firebase/firestore'
import { db } from './firebase'
import { get, writable } from 'svelte/store'

// Buat store
export const profile = writable(null)

export const username = writable(null)

export const userId = writable('')

export const getProfile = async (username) => {
	const q = query(collection(db, 'users'), where('username', '==', username))

	try {
		const querySnapshot = await getDocs(q)
		if (!querySnapshot.empty) {
			const docSnap = querySnapshot.docs[0] // Ambil dokumen pertama yang cocok
			const data = docSnap.data()

			// Pastikan struktur data sesuai
			profile.set({
				name: data.name || '',
				username: data.username || '',
				password: data.password || '',
				score: data.score || 0,
				words: Array.isArray(data.words) ? data.words : [],
				reports: typeof data.reports === 'object' ? data.reports : {},
				lastUpdatedAt: data.lastUpdatedAt || new Date().toISOString(),
			})

			// Update reports dengan nilai default berdasarkan tanggal hari ini
			let shouldSave = false
			profile.update((p) => {
				const today = new Date().toDateString()
				if (!p.reports[today]) {
					p.reports[today] = {
						words: [],
						score: 0,
					}
					shouldSave = true
				}
				return p
			})

			if (shouldSave && username !== null) {
				await saveProfile(get(profile), username)
			}
		} else {
			console.log('No such document!')

			// Pastikan struktur data sesuai
			profile.set({
				name: '',
				username: username,
				password: '',
				score: 0,
				words: [],
				reports: {},
				lastUpdatedAt: new Date().toISOString(),
			})

			// Update reports dengan nilai default berdasarkan tanggal hari ini
			let shouldSave = false
			profile.update((p) => {
				const today = new Date().toDateString()
				if (!p.reports[today]) {
					p.reports[today] = {
						words: [],
						score: 0,
					}
					shouldSave = true
				}
				return p
			})

			if (shouldSave && username !== null) {
				await saveProfile(get(profile), username)
			}
		}
	} catch (error) {
		console.error('Error loading data:', error)
		profile.set({
			name: '',
			username: username,
			password: '',
			score: 0,
			words: [],
			reports: {},
			lastUpdatedAt: new Date().toISOString(),
		})
	}
}

export const saveProfile = async (profile, username) => {
	try {
		if (!profile || typeof profile !== 'object') {
			throw new Error('Invalid profile data')
		}

		const user = get(userId)

		console.log(user)

		if (user) {
			// Jika user sedang login, gunakan userId dari sesi
			const userRef = doc(db, 'users', user)
			await setDoc(userRef, profile, { merge: true })
			console.log('Profile updated successfully with userId from session')
			return true
		}

		// Cari dokumen dengan username yang sesuai
		const q = query(collection(db, 'users'), where('username', '==', username))
		const querySnapshot = await getDocs(q)

		if (!querySnapshot.empty) {
			console.log('Profile already exists. No new data saved.')
			// Jika user sudah ada, update dokumen pertama yang ditemukan
			const userDoc = querySnapshot.docs[0].ref
			await updateDoc(userDoc, profile, { merge: true })
			return true
		}

		const profileRef = doc(collection(db, 'users')) // Buat dokumen baru
		await setDoc(profileRef, profile, { merge: true })
		console.log('Profile saved successfully')
		return true
	} catch (e) {
		console.error('Error saving data:', e)
		return false
	}
}

// Fungsi Login
export const login = async (username, password) => {
	try {
		if (!username) {
			return {
				success: false,
				errors: {
					name: '',
					username: 'Jangan kosong ya namanya',
					password: '',
				},
			}
		}

		if (!password) {
			return {
				success: false,
				errors: {
					name: '',
					username: '',
					password: 'Password tidak boleh kosong',
				},
			}
		}

		// Cari user berdasarkan username di database
		const q = query(collection(db, 'users'), where('username', '==', username))
		const querySnapshot = await getDocs(q)

		if (querySnapshot.empty) {
			return {
				success: false,
				errors: { name: '', username: 'User tidak ditemukan', password: '' },
			}
		}

		const userDoc = querySnapshot.docs[0] // Ambil dokumen pertama yang cocok
		const userData = userDoc.data()

		if (userData.password !== password) {
			return {
				success: false,
				errors: { name: '', username: '', password: 'Password salah' },
			}
		}

		await getProfile(username)
		// Simpan sesi user
		sessionStorage.setItem('userId', userDoc.id)
		return { success: true, user: { id: userDoc.id, ...userData } }
	} catch (error) {
		return {
			success: false,
			errors: { name: '', username: '', password: error.message },
		}
	}
}

// Fungsi Register
export const register = async (name, username, password) => {
	try {
		if (!name) {
			return {
				success: false,
				errors: {
					name: 'Jangan kosong ya namanya',
					username: '',
					password: '',
				},
			}
		}

		if (!username) {
			return {
				success: false,
				errors: { name: '', username: 'Username harus di isi', password: '' },
			}
		}

		if (!password) {
			return {
				success: false,
				errors: {
					name: '',
					username: '',
					password: 'Password tidak boleh kosong',
				},
			}
		}

		// Cek apakah user sudah ada
		const q = query(collection(db, 'users'), where('username', '==', username))
		const querySnapshot = await getDocs(q)

		if (!querySnapshot.empty) {
			return {
				success: false,
				errors: { name: '', username: 'Nama sudah digunakan', password: '' },
			}
		}

		const newProfile = {
			name,
			username,
			password,
			score: 0,
			words: [],
			reports: {},
			lastUpdatedAt: new Date().toISOString(),
		}

		const today = new Date().toDateString()
		if (!newProfile.reports[today]) {
			newProfile.reports[today] = {
				words: [],
				score: 0,
			}
		}

		// Simpan user baru ke database
		const newUserRef = await addDoc(collection(db, 'users'), newProfile)
		// Simpan sesi user
		sessionStorage.setItem('userId', newUserRef.id)
		return { success: true, user: { id: newUserRef.id, username, score: 0 } }
	} catch (error) {
		return {
			success: false,
			errors: { name: '', username: '', password: error.message },
		}
	}
}
