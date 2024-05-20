<script>
	import * as L from "partial.lenses";
	import * as R from "ramda";
	import { atom, view, read, failableView } from "./svatom.svelte.js";
	import * as eins from "./einsum.js";

	const examples = [
		"ij",
		"ji",
		"ii->i",
		"ii",
		"ij->",
		"ij->j",
		"ij->i",
		"ij,ij->ij",
		"ij,ji->ij",
		"ij,jk",
		"ij,kj->ik",
		"ij,kj->ikj",
		"ij,kl->ijkl",
	];

	// Atoms
	const einsum = atom({
		inputs: [["j", "k", "l"], ["k", "l"], ["j"]],
		outputs: ["j", "k"],
	});

	const inputDimensions = $derived(
		read(eins.lenses.inputDimensions, einsum).allUniq,
	);
	const outputDimensions = $derived(
		read(eins.lenses.outputDimensions, einsum).value,
	);

	const summationDimensions = $derived(
		R.difference(inputDimensions, outputDimensions),
	);

	const formatted = failableView(eins.lenses.parser, einsum);
	const asJson = view(L.inverse(L.json()), einsum);
</script>

<section>
	<h1>Einsum Notation</h1>

	<div class="button-bar">
		{#each examples as ex}
			<button type="button" onclick={() => (formatted.value = ex)}
				>{ex}</button
			>
		{/each}
	</div>

	<textarea
		class:syntax-error={formatted.hasError}
		bind:value={formatted.value}
		onblur={formatted.reset}
	></textarea>

	<div style:min-height="2em">
		{#if formatted.hasError}
			<span class="error-message">{formatted.error.message}</span>
		{/if}
	</div>

	<pre>{asJson.value}</pre>

	<pre>def sum({read(eins.lenses.inputTensors, einsum)
			.value.map((x) => `input${x}`)
			.join(", ")}):<!---->
{#each einsum.value.inputs as inp, i}<!--
			as -->	({inp
				.map((x) => `N${x}`)
				.join(", ")}) = input{i}.shape
<!---->{/each}
	result = np.zeros(({outputDimensions.map((x) => `N${x}`).join(", ")}))

{outputDimensions
			.map(
				(x, i) =>
					`${R.join("", R.repeat("\t", i + 1))}for ${x} in range(N${x}):`,
			)
			.join("\n")}
{R.join("", R.repeat("\t", outputDimensions.length + 1))}total = 0
{summationDimensions
			.map(
				(x, i) =>
					`${R.join("", R.repeat("\t", i + outputDimensions.length + 1))}for ${x} in range(N${x}):`,
			)
			.join("\n")}

{R.join(
			"",
			R.repeat("\t", outputDimensions.length + 1),
		)}output[{outputDimensions.map((x) => `${x}`).join(", ")}] = total

	return result</pre>

	<h3>Input Tensors</h3>
	<ul>
		{#each read(eins.lenses.inputTensors, einsum).value as t}
			<li>x {t}</li>
		{/each}
	</ul>

	<h3>Inputs</h3>
	<ul>
		{#each inputDimensions as inputDim}
			<li>{inputDim}</li>
		{/each}
	</ul>

	<h3>Outputs</h3>
	<ul>
		{#each outputDimensions as outputDim}
			<li>{outputDim}</li>
		{:else}
			<li><em>None</em></li>
		{/each}
	</ul>

	<h3>Summations</h3>
	<ul>
		{#each summationDimensions as summationDim}
			<li>{summationDim}</li>
		{:else}
			<li><em>None</em></li>
		{/each}
	</ul>
</section>

<style>
	section {
		margin: 3em auto;
		max-width: 60em;
	}

	.syntax-error {
		color: #aa0000;
		outline: #aa0000 3px solid;
		background: #ffdddd;
	}

	.error-message {
		color: #aa0000;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		gap: 0.5em;
		flex-direction: column;
	}

	pre {
		white-space: pre-wrap;
		background: #333;
		color: #fff;
		height: 10em;
		overflow: auto;
		resize: vertical;
		padding: 1em;
		box-sizing: border-box;
	}

	textarea {
		white-space: pre-wrap;
		background: #ffffee;
		color: #000;
		width: 100%;
		min-height: 10em;
		border: 0;
		resize: vertical;
		padding: 1em;
		box-sizing: border-box;
	}

	.number-picker {
		display: flex;
		align-items: center;
		gap: 1em;
	}

	input[type="range"] {
		padding: 1em;
		margin: 0;
	}

	input[type="text"] {
		margin: 0;
	}

	.phantom {
		visibility: hidden;
	}

	.controls {
		display: flex;
		margin: 1em 0;
	}

	button {
		border: none;
		background: #111;
		color: #fff;
		padding: 0.3em 0.5em;
		display: inline-block;
		font: inherit;
		cursor: pointer;
	}

	.button-bar {
		display: flex;
		gap: 0.2em;
	}
</style>
