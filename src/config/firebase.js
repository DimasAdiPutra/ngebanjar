// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: 'AIzaSyCaQlyYek50m6sc7kMeXPIJY2fvXEhwoO4',
	authDomain: 'ngebanjar-e572d.firebaseapp.com',
	projectId: 'ngebanjar-e572d',
	storageBucket: 'ngebanjar-e572d.firebasestorage.app',
	messagingSenderId: '434077312661',
	appId: '1:434077312661:web:2f1171a3c4b76700009d9c',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export { db }
