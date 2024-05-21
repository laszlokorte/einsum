<script>
	import PythonIndent from "./PythonIndent.svelte";
	import * as R from "ramda";
	let { left, right, op = "=" } = $props();
</script>

<PythonIndent /><span>{left}</span>
<span class="python-op">{op}</span> <span>{right}</span><br />
