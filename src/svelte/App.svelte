<script>
	import * as L from "partial.lenses";
	import * as R from "ramda";
	import { atom, view, read, failableView } from "./svatom.svelte.js";
	import { clamp } from "./utils.js";

	// Atoms
	const einsum = atom({
		inputs: [["j", "k", "l"], ["k", "l"], ["j"]],
		outputs: ["j", "k"],
	});

	const B1 = R.curry((a, b, c, d) => {
		return a(b(d))(c(d));
	});

	const lindex = (xtra) =>
		L.lens(
			(a) =>
				Array(a + xtra)
					.fill(0)
					.map((_, i) => i),
			(c, a) => c.length - xtra,
		);

	const expect = (message, pred) => (v) => {
		if (pred(v)) {
			return v;
		} else {
			throw new Error(message);
		}
	};
	null;

	const unqiue = L.lens(R.uniq, (n, o) =>
		R.filter((oo) => R.any(R.equals(oo), n), o),
	);

	const inputTensors = ["inputs", L.elems, "length", lindex(0)];
	const inputDimensions = ["inputs", L.elems, L.elems];
	const outputDimensions = [
		L.choice(
			["outputs"],
			[
				L.foldTraversalLens(L.counts, ["inputs", L.elems, L.elems]),
				L.reread((m) => [...m.entries()]),
				L.normalize(R.sortBy(R.prop(0))),
				L.filter(([x, c]) => c == 1),
				L.normalize(R.map(R.prop(0))),
			],
		),
	];

	const summationDimensions = $derived(
		R.difference(
			read(inputDimensions, einsum).allUniq,
			read(outputDimensions, einsum).value,
		),
	);

	const parser = L.iso(
		B1(
			R.curry((a, b) => (b !== null ? `${a}->${b}` : a)),
			R.compose(R.join(","), R.map(R.join("")), R.prop("inputs")),
			R.compose(
				R.ifElse(R.has("length"), R.join(""), R.always(null)),
				R.prop("outputs"),
			),
		),
		(e) => {
			try {
				return R.compose(
					expect(
						"Each output dimension must occure at least once as input dimension",
						R.compose(
							R.isEmpty,
							B1(
								R.difference,
								R.compose(R.defaultTo([]), R.prop("outputs")),
								R.compose(R.unnest, R.prop("inputs")),
							),
						),
					),
					R.compose(
						B1(
							R.curryN(2, R.pipe),
							R.compose(
								R.assoc("inputs"),
								R.map(
									R.compose(
										R.map(
											expect(
												"only single letters are allowed in input dimensions",
												R.test(/[a-z]/),
											),
										),
										R.split(""),
									),
								),
								R.split(","),
								R.prop(0),
							),
							R.ifElse(
								R.compose(R.equals(2), R.length),
								R.compose(
									R.assoc("outputs"),
									expect(
										"output dimensions must be unqiue",
										B1(
											R.equals,
											R.compose(R.length, R.identity),
											R.compose(R.length, R.uniq),
										),
									),
									R.map(
										expect(
											"only single letters are allowed in output dimensions",
											R.test(/[a-z]/),
										),
									),
									R.split(""),
									R.prop(1),
								),
								R.always(R.assoc("outputs", undefined)),
							),
						),
						R.compose(
							expect(
								"only a single -> is allowed to separate input and output",
								R.compose(R.gte(2), R.length),
							),
							R.split("->"),
							expect(
								"Notation must not be empty",
								R.compose(R.not, R.isEmpty),
							),
						),
					)(e),
				)(Object.create(null));
			} catch (e) {
				return e;
			}
		},
	);

	const formatted = failableView(parser, einsum);
	const asJson = view(L.inverse(L.json()), einsum);
</script>

<section>
	<h1>Einsum Notation</h1>

	<textarea
		class:syntax-error={formatted.hasError}
		bind:value={formatted.value}
	></textarea>

	<div style:min-height="2em">
		{#if formatted.hasError}
			<span class="error-message">{formatted.error.message}</span>
		{/if}
	</div>

	<pre>{asJson.value}</pre>

	<pre>def sum({read(inputTensors, einsum)
			.value.map((x) => `input${x}`)
			.join(", ")}):<!---->
{#each einsum.value.inputs as inp, i}<!--
			as -->	({inp
				.map((x) => `N${x}`)
				.join(", ")}) = input{i}.shape
<!---->{/each}
	result = np.zeros(({read(outputDimensions, einsum)
			.value.map((x) => `N${x}`)
			.join(", ")}))

{read(outputDimensions, einsum)
			.value.map(
				(x, i) =>
					`${R.join("", R.repeat("\t", i + 1))}for ${x} in range(N${x}):`,
			)
			.join("\n")}
{R.join(
			"",
			R.repeat("\t", read(outputDimensions, einsum).value.length + 1),
		)}total = 0
{summationDimensions
			.map(
				(x, i) =>
					`${R.join("", R.repeat("\t", i + read(outputDimensions, einsum).value.length + 1))}for ${x} in range(N${x}):`,
			)
			.join("\n")}

{R.join(
			"",
			R.repeat("\t", read(outputDimensions, einsum).value.length + 1),
		)}output[{read(outputDimensions, einsum)
			.value.map((x) => `${x}`)
			.join(", ")}] = total

	return result</pre>

	<h3>Input Tensors</h3>
	<ul>
		{#each read(inputTensors, einsum).value as t}
			<li>x {t}</li>
		{/each}
	</ul>

	<h3>Inputs</h3>
	<ul>
		{#each read(inputDimensions, einsum).allUniq as inputDim}
			<li>{inputDim}</li>
		{/each}
	</ul>

	<h3>Outputs</h3>
	<ul>
		{#each read(outputDimensions, einsum).all as outputDim}
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
</style>
