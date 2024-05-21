<script>
	import * as L from "partial.lenses";
	import * as R from "ramda";
	import { atom, view, read, failableView } from "./svatom.svelte.js";
	import * as eins from "./einsum.js";
	import PythonLoop from "./PythonLoop.svelte";
	import PythonDef from "./PythonDef.svelte";
	import PythonIndent from "./PythonIndent.svelte";
	import PythonAssign from "./PythonAssign.svelte";
	import PythonReturn from "./PythonReturn.svelte";
	import PythonComment from "./PythonComment.svelte";
	import {forcePlain} from "./contenteditable.js";

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
		"in->valid",
	];

	// Atoms
	const inputField = atom()
	const einsum = atom({
		inputs: [["i"]],
		outputs: ["i","i"],
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

	const inputTensors = $derived(read(eins.lenses.inputTensors, einsum).value)

	const formatted = failableView(eins.lenses.parser, einsum, (x) => x.slice(0, 30));
	const asJson = view(L.inverse(L.json()), einsum);

	function mulsum(inputs) {
		return R.join(' + ', R.addIndex(R.map)((dims, i) => `input${inputToLetter(i)}[(${R.join(',', dims)})]`, inputs))
	}

	function inputToLetter(n) {
		return String.fromCharCode(n+65)
	}
</script>

<section>
	<h1><img src="../../favicon.svg" class="icon" alt="Einsum Icon">Einsum Notation</h1>

	<p><strong><a href="https://numpy.org/doc/stable/reference/generated/numpy.einsum.html"><code>np.einsum</code></a> is a <a href="https://numpy.org">numpy</a> function that allows to describe and execute common for-loop-summation patterns in a concise notation.</strong></p>
	<p>
		When working with multidimensional arrays a very common calculation is to multiply elements of multiple arrays together and optionally sum the results along a dimension. A few examples for such kind of operation are the <a href="https://numpy.org/doc/stable//reference/generated/numpy.dot.html">dot-product</a>, the <a href="https://numpy.org/doc/stable//reference/generated/numpy.matmul.html">vector-matrix-product</a>, or the <a href="https://numpy.org/doc/stable//reference/generated/numpy.outer.html">outer product</a>. 
	</p>
	<p>
		For many of these operations libraries like numpy provide individual implementations. For multiplying two matrices for example it is not necessary to manually iterate over the rows and columns of the matrices, but instead <code>np.matmul(A,B)</code> can be used. The advantage is both a higher level of abstraction and the opportunity to rely on internal optimazations of the math library, in this case numpy.
	</p>
	<p>
		But only some of these array operations are common enough that they have a proper name and are provided by a math library. Sometimes a more specific kind of operation is needed to combine multiple arrays. In such a case it might be necessary to fall back to hand written loops. <em>Or not!</em>
	</p>
	<p>
		Einsum is a domain specific language (DSL) that allows to express a specific class of common array iteration patterns in a concise way. It in inspired by the <a href="https://en.wikipedia.org/wiki/Einstein_notation">Einstein notation</a>, hence the name. <a href="https://ajcr.net/Basic-guide-to-einsum/">There exist</a> <a href="https://rockt.github.io/2018/04/30/einsum">already</a> <a href="https://obilaniu6266h16.wordpress.com/2016/02/04/einstein-summation-in-numpy/">plenty of</a> excellent and detailled explanations of einsum online. This tool contributes by providing an interactive approach to convert einsum notation into the corresponding python code.
	</p>
	<p>
		Try the examples below and see how much more concise the einsum notations are.
	</p>

	<h3>Enter your Einsum notation</h3>

	<div class="button-bar">
		<span class="button-bar-intro">Examples: </span>
		{#each examples as ex}
			<button type="button" onclick={() => (formatted.value = ex)}
				>{ex}</button
			>
		{/each}
	</div>

	<div class="code-template">
		<span class="code-template-start">out = np.einsum("</span><span
		id="input-field"
		bind:this={inputField.value}
		class="code-placeholder code-template-content"
		contenteditable
		max="30"
		use:forcePlain
		class:syntax-error={formatted.hasError}
		bind:textContent={formatted.value}
	></span><span class="code-template-end">", {R.join(', ', R.map((x) => `input${inputToLetter(x)}`, inputTensors))})</span>

	<span role="button" tabindex="-1" onkeypress={() => inputField.value.focus()} onclick={() => inputField.value.focus()} for={'input-field'} class="code-template-prompt">Edit here!</span>
	</div>

	{#if formatted.hasError}
		<div class="error-message">
			{formatted.error.message}<br>
			<em>The general einsum syntax is <code>/[a-z]*(,[a-z]*)*(->[a-z]*)?/</code></em>
		</div>
	{/if}

	<div hidden={formatted.hasError}>
		

		
		<h3>Python/Numpy Notation</h3>
		<div class="code-snippet">
			{@render pythonImpl()}
		</div>

		<h3>Math Notation</h3>
		<p>
			Below you can see the corresponding mathematical notation. By the conventions of the <a href="https://en.wikipedia.org/wiki/Einstein_notation">Einstein notation</a> the Summation operator is typically not written because it can be infered.
		</p>
		<div>
			{@render mathNotation()}
		</div>


		<div hidden>
			<h3>Input Tensors</h3>
			<ul>
				{#each inputTensors as t}
					<li>x {t}</li>
				{/each}
			</ul>

			<h3>Input Dimensions</h3>
			<ul>
				{#each inputDimensions as inputDim}
					<li>{inputDim}</li>
				{/each}
			</ul>

			<h3>Output Dimensions</h3>
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
		</div>
	</div>
</section>


{#snippet pythonImpl()}
	<PythonComment text="This is the python function that you would need to write" />
	<PythonComment text="to achieve the same result as the np.einsum call with the given notation" />
	<PythonDef name="calculateSum" params={R.map((x) => `input${inputToLetter(x)}`, inputTensors)}>
		{#snippet children()}
			<PythonComment text="TODO: Extract Dimension sizes from input" />
			{#each inputDimensions as inDim}
				<PythonAssign left={`dimSize${inDim.toUpperCase()}`} right={`...`} />
			{/each}
			<br>
			<PythonComment text="Initialize output array with correct size and dimensions" />
			<PythonAssign left={`result`} right={`np.zeros((${R.join(',', outputDimensions)}))`} /><br>
			<PythonComment text={'Iterate over output dimensions'} />
			{@render freeLoop(outputDimensions)}
			<PythonReturn value={`result`} />
		{/snippet}
	</PythonDef>
	<br>
	<PythonComment text="Call manually implemented python function" />
	<PythonAssign left={`out`} right={`calculateSum(${R.map((x) => `input${inputToLetter(x)}`, inputTensors)})`} />
{/snippet}

{#snippet freeLoop(remaining)}
	{#if remaining.length == 0}
		{@render summation()}
	{:else}
	<PythonLoop iter={remaining[0]} collection={`range(dimSize${remaining[0].toUpperCase()})`}>
		{#snippet children()}
			{@render freeLoop(remaining.slice(1))}
		{/snippet}
	</PythonLoop>
	{/if}
{/snippet}

{#snippet sumLoop(remaining)}
	{#if remaining.length === 0}
		<PythonAssign left={`accum`} op={'+='} right={mulsum(einsum.value.inputs)} />
	{:else}
		<PythonLoop iter={remaining[0]} collection={`range(dimSize${remaining[0].toUpperCase()})`}>
			{#snippet children()}
				{@render sumLoop(remaining.slice(1))}
			{/snippet}
		</PythonLoop>
	{/if}
{/snippet}

{#snippet summation()}
	{#if summationDimensions.length}
	<PythonAssign left={`accum`} right={`0`} />
	<PythonComment text={'Sum accross all dimension that do not occure in output array'} />
	{@render sumLoop(summationDimensions)}
	<PythonComment text={'Assign sum into output array'} />
	<PythonAssign left={`result[(${R.join(',', outputDimensions)})]`} right={`accum`} /><br>
	{:else}
	{#if einsum.value.inputs.length > 1}
	<PythonComment text={'Assign sum into output array'} />
	{:else}
	<PythonComment text={'Assign into output array'} />
	{/if}
	<PythonAssign left={`result[(${R.join(',', outputDimensions)})]`} op={'='} right={mulsum(einsum.value.inputs)} /><br>
	{/if}
{/snippet}

{#snippet mathNotation()}
	<math display="block" class="tml-display" style="display:block math;">
	  <mrow>
	    <msub>
	      <mi>Out</mi>
	      <mrow>
	      	{#each outputDimensions as out}
	        	<mi>{out}</mi>
	      	{/each}
	      </mrow>
	    </msub>
	    <mo>=</mo>
	    <mrow>
	      {#each summationDimensions as sum}
	      	<munderover>
		        <mo movablelimits="false">∑</mo>
		        <mi>{sum}</mi>
		        <mi>{sum.toUpperCase()}</mi>
		      </munderover>
	      {/each}
		   {#each inputTensors as input, i}
		   	{#if i > 0}
		   	<mo>⋅</mo>
		   	{/if}
		   	<msub>
		      <mi>{inputToLetter(input)}</mi>
		      <mrow>
		      	{#each einsum.value.inputs[input] as d}
		        <mi>{d}</mi>
		      	{/each}
		      </mrow>
		    </msub>
		   {/each}
	    </mrow>
	  </mrow>
	</math>
{/snippet}

<footer>
	<a href="https://tools.laszlokorte.de" title="More education tools">More education tools</a>
</footer>

<style>
	@import './python.css';

	footer {
		text-align: center;
		padding: 2em;
		border-top: 1px solid #aaa;
		margin-top: 2em;
	}

	.icon {
		height: 2em;
		width: 2em;
		display: inline-block;
		vertical-align: middle;
		margin: 0 0.5em 0 0;
	}

	section {
		margin: 3em auto;
		max-width: 60em;
	}

	.code-snippet {
		display: block;
		background: #333;
		color: #fff;
		padding: 1em;
		font-family: monospace;
		font-size: 1.3em;
		line-height: 1.4;

	}

	.code-template {
		background: #333;
		color: #fff;
		padding: 1em;
		font-size: 2em;
		font-family: monospace;
		display: grid;
		grid-template-columns: auto auto auto;
		justify-content: start;
		align-items: baseline;
	}

	.code-template-start {
		grid-column: 1;
	}

	.code-template-content {
		grid-column: 2;
	}

	.code-template-end {
		grid-column: 3;
	}

	.code-template-prompt {
		grid-column: 2;
		grid-row: 2;
		text-align: center;
		align-items: center;
		font-size: 0.5em;
		color: #cceeff;
		user-select: none;
	}

	.code-placeholder {
		min-width: 1em;
		display: inline-block;
		background: #cceeff;
		color: #000;
		padding: 0.2em 0.4em;
		margin: 0.2em;
	}

	.syntax-error {
		color: #aa0000;
		outline: #aa0000 3px solid;
		background: #ffdddd;
	}

	.error-message {
		padding: 1em;
		color: #aa0000;
		background: #ffdddd;
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
		background: #2541AD;
		color: #fff;
		padding: 0.3em 0.5em;
		display: inline-block;
		font: inherit;
		cursor: pointer;
	}

	button:hover {
		background: #2562AD;
	}

	button:active {
		background: #252AAD;
	}

	button:focus-visible {
		outline: 3px solid #4DAACE;
	}

	.button-bar {
		display: flex;
		gap: 0.2em;
		margin: 4px 0;
		align-items: baseline;
	}

	.button-bar-intro {
		padding-right: 0.5em;
	}
</style>
