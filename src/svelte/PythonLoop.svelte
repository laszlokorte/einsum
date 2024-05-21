<script>
	import PythonIndent from './PythonIndent.svelte'
	import * as R from "ramda";
	import { indent, getDepth } from "./python_depth";
    import PythonBlock from './PythonBlock.svelte';

	let {iter, collection, children} = $props();
</script>

<PythonIndent /><span class="python-kw">for</span> <span>{iter}</span> <span class="python-kw">in</span> <span>{collection}</span><span class="python-colon">:</span><br>
<PythonBlock>
	{@render children()}
</PythonBlock>


