<script>
	import { createEventDispatcher, onDestroy } from 'svelte'
	import { profile } from '../config/profile.js'
	import { dictionaries, words } from '../config/dictionary.js'
	import Button from '../components/Button.svelte'
	import { clickedUp } from '../config/audio.js'

	const dispatcher = createEventDispatcher()

	export let index
	let questionIndex = 0
	let totalQuestions = 10
	let answers = []
	let score = 0
	const usedQuestions = new Set() // Menyimpan indeks soal yang sudah muncul

	const getWordIndex = () => {
		if (usedQuestions.size >= totalQuestions) return -1 // Cegah infinite loop

		let randomInt
		do {
			const min = Math.ceil(startIndex)
			const max = Math.floor(index - 1)
			randomInt = Math.floor(Math.random() * (max - min + 1)) + min
		} while (
			usedQuestions.has(randomInt) ||
			!dictionaries[words[randomInt]].examples
		)

		usedQuestions.add(randomInt) // Tandai soal sebagai sudah digunakan
		console.log({ getWordIndex: randomInt })
		return randomInt
	}

	const shuffleArray = (arr) => {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			;[arr[i], arr[j]] = [arr[j], arr[i]]
		}
		return arr
	}

	const todayLearnedWord =
		$profile.reports[new Date().toDateString()].words.length
	const startIndex = index - todayLearnedWord

	let wordIndex = getWordIndex()
	let word = words[wordIndex]
	let dictionary = dictionaries[word]

	const getRandomWord = () => {
		const min = Math.ceil(0)
		const max = Math.floor(index)
		const randomInt = Math.floor(Math.random() * (max - min + 1)) + min

		if (randomInt === wordIndex) {
			return getRandomWord()
		}

		console.log({ getRandomWord: words[randomInt] })
		return words[randomInt]
	}

	const generateChoices = () => {
		const choices = new Array(3).fill(null).map(() => getRandomWord())
		choices.push(words[wordIndex])
		return shuffleArray(choices)
	}

	let choices = generateChoices()
	let question = dictionary.examples[0]

	if ($profile.words.length === words.length) {
		dispatcher('finish')
	}

	const maxCounter = 60
	let counter = maxCounter
	let interval

	const startTimer = () => {
		clearInterval(interval)
		counter = maxCounter
		interval = setInterval(() => {
			clickedUp.load()
			clickedUp.play().then(() => {
				counter--
				if (counter <= 0) {
					clearInterval(interval)
					location.href = '#timeout'
				}
			})
		}, 1000)
	}

	startTimer()

	const nextQuestion = () => {
		if (questionIndex < totalQuestions - 1) {
			questionIndex++
			wordIndex = getWordIndex()
			if (wordIndex === -1)
				return dispatcher('quiz', {
					score: answers.filter(Boolean).length * 10,
				})

			word = words[wordIndex]
			dictionary = dictionaries[word]
			choices = generateChoices()
			question = dictionary.examples[0]
			startTimer()
		} else {
			dispatcher('quiz', { score }) // Kirim score setelah 10 soal
		}
	}

	const submit = (w) => {
		clearInterval(interval)
		answers.push(w === word)

		if (questionIndex < totalQuestions - 1) {
			nextQuestion()
		} else {
			const score = answers.filter(Boolean).length * 10
			dispatcher('quiz', { score }) // Kirim score terakhir
		}
	}

	onDestroy(() => clearInterval(interval))
</script>

<div class="container">
	<h1>KUIS</h1>
	<h2>{counter.toString().padStart(2, '0')}</h2>
	<p class="instruction">Lengkapi kalimat berikut:</p>
	<p class="question">
		{questionIndex + 1}. "{question.banjar.replace(word, '___')}"
	</p>
	<p class="hint">{question.indonesia}</p>

	<div class="answer-wrapper">
		<div class="answers">
			{#each choices as choice}
				<Button
					on:click={() => submit(choice)}
					class="fixed-size background-purple orange">{choice}</Button
				>
			{/each}
		</div>
	</div>
</div>

<style>
	.container {
		margin: 0 25px;
		padding-top: 88px;
	}

	.instruction {
		margin-bottom: 0;
		font-size: 0.85em;
	}

	.question {
		margin-top: 5px;
		margin-bottom: 0;
		font-size: 1.5em;
		font-style: italic;
		font-weight: bold;
	}

	.hint {
		margin-top: 5px;
		font-weight: bold;
	}

	.answers {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20px;
		grid-auto-rows: minmax(10px, auto);
	}

	.answer-wrapper {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 50px;
	}

	h1 {
		margin-bottom: 0;
	}

	@media (max-width: 480px) {
		.container {
			margin-bottom: 85px;
			padding-top: 25px;
		}

		.answers {
			gap: 10px;
		}
	}
</style>
