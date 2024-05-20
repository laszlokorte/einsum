import * as L from "partial.lenses";
import * as R from "ramda";
import { B1, expect } from "./combinators.js";
import { lindex } from "./lenses.js";

export const lenses = {
	unique: L.lens(R.uniq, (n, o) =>
		R.filter((oo) => R.any(R.equals(oo), n), o),
	),
	inputTensors: ["inputs", L.elems, "length", lindex(0)],
	inputDimensions: ["inputs", L.elems, L.elems],
	outputDimensions: [
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
	],
	parser: L.iso(
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
								R.compose(
									R.defaultTo([]),
									R.prop("outputs"),
								),
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
	),
};