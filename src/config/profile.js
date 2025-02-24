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

export const name = writable(null)

export const userId = writable('')

export const getProfile = async (name) => {
	const q = query(collection(db, 'users'), where('name', '==', name))

	try {
		const querySnapshot = await getDocs(q)
		if (!querySnapshot.empty) {
			const docSnap = querySnapshot.docs[0] // Ambil dokumen pertama yang cocok
			const data = docSnap.data()

			// Pastikan struktur data sesuai
			profile.set({
				name: data.name || '',
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

			if (shouldSave && name !== null) {
				await saveProfile(get(profile), name)
			}
		} else {
			console.log('No such document!')

			// Pastikan struktur data sesuai
			profile.set({
				name: name,
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

			if (shouldSave && name !== null) {
				await saveProfile(get(profile), name)
			}
		}
	} catch (error) {
		console.error('Error loading data:', error)
		profile.set({
			name: name,
			password: '',
			score: 0,
			words: [],
			reports: {},
			lastUpdatedAt: new Date().toISOString(),
		})
	}
}

export const saveProfile = async (profile, name) => {
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

		// Cari dokumen dengan name yang sesuai
		const q = query(collection(db, 'users'), where('name', '==', name))
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
export const login = async (name, password) => {
	try {
		if (!name) {
			return {
				success: false,
				errors: { name: 'Jangan kosong ya namanya', password: '' },
			}
		}

		if (!password) {
			return {
				success: false,
				errors: { name: '', password: 'Password tidak boleh kosong' },
			}
		}

		// Cari user berdasarkan name di database
		const q = query(collection(db, 'users'), where('name', '==', name))
		const querySnapshot = await getDocs(q)

		if (querySnapshot.empty) {
			return {
				success: false,
				errors: { name: 'User tidak ditemukan', password: '' },
			}
		}

		const userDoc = querySnapshot.docs[0] // Ambil dokumen pertama yang cocok
		const userData = userDoc.data()

		if (userData.password !== password) {
			return {
				success: false,
				errors: { name: '', password: 'Password salah' },
			}
		}

		await getProfile(name)
		// Simpan sesi user
		sessionStorage.setItem('userId', userDoc.id)
		return { success: true, user: { id: userDoc.id, ...userData } }
	} catch (error) {
		return { success: false, errors: { name: '', password: error.message } }
	}
}

// Fungsi Register
export const register = async (name, password) => {
	try {
		if (!name) {
			return {
				success: false,
				errors: { name: 'Jangan kosong ya namanya', password: '' },
			}
		}

		if (!password) {
			return {
				success: false,
				errors: { name: '', password: 'Password tidak boleh kosong' },
			}
		}

		// Cek apakah user sudah ada
		const q = query(collection(db, 'users'), where('name', '==', name))
		const querySnapshot = await getDocs(q)

		if (!querySnapshot.empty) {
			return {
				success: false,
				errors: { name: 'Nama sudah digunakan', password: '' },
			}
		}

		const newProfile = {
			name,
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
		return { success: true, user: { id: newUserRef.id, name, score: 0 } }
	} catch (error) {
		return { success: false, errors: { name: '', password: error.message } }
	}
}
