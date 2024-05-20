import { mount } from 'svelte';
import App from './App.svelte';

export default function(domRoot) {
	mount(App, {
		target: domRoot
	});
}



	export const expect = (message, pred) => (v) => {
		if (pred(v)) {
			return v;
		} else {
			throw new Error(message);
		}
	};