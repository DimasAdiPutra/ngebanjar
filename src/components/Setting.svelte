<script>
	import CircleButton from './CircleButton.svelte'
	import Input from './Input.svelte'
	import { createEventDispatcher } from 'svelte'
	import { profile, userId } from '../config/profile.js'

	const dispatcher = createEventDispatcher()

	let name = $profile.name
	let username = $profile.username
	let password = $profile.password
	let isRegistering = false // Toggle untuk mode register/login

	export let errors = { name: '', username: '', password: '' } // Tambahkan prop error

	const login = () => {
		dispatcher('login', { username, password })
	}
	const register = () => {
		dispatcher('register', { name, username, password })
	}

	function logout() {
		// Tambahkan logika logout di sini (misalnya hapus userId dari session)
		sessionStorage.clear()

		// Reload halaman dan arahkan ke home
		window.location.href = '/'
	}
</script>

<div class="backdrop">
	<div class="modal">
		{#if $userId}
			<h2>Selamat Datang, Pejuang Bahasa Banjar!</h2>
			<p>Apa pelajarannya menyenangkan?</p>
		{:else}
			<h2>
				{isRegistering
					? 'Buat Akun Baru'
					: 'Selamat Datang, Pejuang Bahasa Banjar!'}
			</h2>
			<p>
				{isRegistering
					? 'Isi data di bawah untuk mendaftar'
					: 'Silakan login terlebih dahulu'}
			</p>
		{/if}

		<div class="input-wrapper">
			{#if isRegistering}
				<Input placeholder="Nama kamu siapa?" bind:value={name}>
					{#if errors.name}
						<small class="warning-text">{errors.name}</small>
					{/if}
				</Input>
			{/if}

			<Input placeholder="Username" bind:value={username}>
				{#if errors.username}
					<small class="warning-text">{errors.username}</small>
				{/if}
			</Input>
			{#if !$userId}
				<Input type="password" placeholder="Password" bind:value={password}>
					{#if errors.password}
						<small class="warning-text">{errors.password}</small>
					{/if}
				</Input>
			{/if}
		</div>

		{#if $profile.username}
			<div class="close-button">
				<CircleButton
					class="red background-none"
					on:click={() => dispatcher('cancel', true)}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="icon icon-tabler icon-tabler-x"
						width="30"
						height="30"
						viewBox="0 0 24 24"
						stroke-width="4"
						stroke="#fff"
						fill="none"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path stroke="none" d="M0 0h24v24H0z" fill="none" />
						<path d="M18 6l-12 12" />
						<path d="M6 6l12 12" />
					</svg>
				</CircleButton>
			</div>
		{/if}

		<div class="button-groups">
			{#if !$userId}
				{#if isRegistering}
					<CircleButton class="orange" on:click={register}>
						<p class="text-white">Register</p>
					</CircleButton>
					<CircleButton class="orange" on:click={() => (isRegistering = false)}>
						<p class="text-white">Login</p>
					</CircleButton>
				{:else}
					<CircleButton class="orange" on:click={login}>
						<p class="text-white">Login</p>
					</CircleButton>
					<CircleButton class="orange" on:click={() => (isRegistering = true)}>
						<p class="text-white">Register</p>
					</CircleButton>
				{/if}
			{:else}
				<CircleButton class="orange" on:click={logout}>
					<p class="text-white">Logout</p>
				</CircleButton>
			{/if}
		</div>
	</div>
</div>

<style>
	.text-white {
		color: var(--white-primary);
	}

	.button-groups {
		display: flex;
		gap: 28px;
		justify-content: center;
	}

	.backdrop {
		height: 100%;
		width: 100%;
		z-index: 100;
		position: absolute;
		top: 0;
		left: 0;
		background-color: rgba(0, 0, 0, 0.3);
	}

	.modal {
		padding: 25px 50px;
		background-color: var(--white-primary);
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		border-radius: 50px;
		color: var(--bg-primary);
		box-shadow: 0 15px 15px 5px rgba(1, 1, 1, 0.2);
		border-top: none;
		border-left: none;
		border-right: none;
		border-bottom: 10px solid var(--white-secondary);
	}

	.warning-text {
		color: red;
	}

	.input-wrapper {
		margin-bottom: 30px;
	}

	.close-button {
		position: absolute;
		top: -10px;
		right: -10px;
	}
</style>
