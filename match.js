const matchIterable = (pat, obj, blists) =>
  Object.keys(pat).reduce(
    (blists, key) => match(pat[key], obj[key], blists),
    blists
  );

const matchArray = (pat, obj, blists) =>
  Array.isArray(obj) ? matchIterable(pat, obj, blists) : [];

const matchObject = (pat, obj, blists) =>
  isObject(obj) ? matchIterable(pat, obj, blists) : [];

const matchRegex = (pat, obj, blists) => {
  const matches = obj.match(pat["regexp"]);
  if (!matches) return [];
  return matchIterable(
    pat["pats"] || [],
    matches.slice(1, matches.length),
    blists
  );
};

const matchOr = (pat, obj, blists) =>
  pat.or.flatMap((pat) => match(pat, obj, blists));

const matchAnd = (pat, obj, blists) =>
  pat.and.reduce((blists, pat) => match(pat, obj, blists), blists);

const matchNot = (pat, obj, blists) =>
  blists.filter((blist) => match(pat.not, obj, [blist]).length === 0);

const matchSome = (pat, obj, blists) =>
  obj.flatMap((val) => match(pat.some, val, blists));

const arrDeepEq = (pat, obj) =>
  Array.isArray(obj) &&
  pat.length === obj.length &&
  pat.every((val, i) => deepEqual(val, obj[i]));

const objDeepEq = (pat, obj) =>
  isObject(obj) &&
  Object.keys(pat).length === Object.keys(obj).length &&
  Object.entries(pat).every(([key, val]) => deepEqual(val, obj[key]));

const deepEqual = (pat, obj) =>
  Array.isArray(pat)
    ? arrDeepEq(pat, obj)
    : isObject(pat)
    ? objDeepEq(pat, obj)
    : pat === obj;

const isObject = (x) =>
  typeof x === "object" && x !== null && !Array.isArray(x);

const isVar = (x) => typeof x === "string" && x[0] === "?";

const bindVar = (variable, value, bindings) =>
  !(variable in bindings)
    ? [{ [variable]: value, ...bindings }]
    : deepEqual(bindings[variable], value)
    ? [bindings]
    : [];

const updateBlists = (variable, value, blists) =>
  blists.flatMap((bindings) => bindVar(variable, value, bindings));

const routeObject = (pat, obj, blists) => {
  if ("regexp" in pat) return matchRegex(pat, obj, blists);
  if ("or" in pat) return matchOr(pat, obj, blists);
  if ("and" in pat) return matchAnd(pat, obj, blists);
  if ("not" in pat) return matchNot(pat, obj, blists);
  if ("some" in pat) return matchSome(pat, obj, blists);
  return matchObject(pat, obj, blists);
};

export const match = (pat, obj, blists = [{}]) => {
  if (blists.length === 0) return [];
  if (Array.isArray(pat)) return matchArray(pat, obj, blists);
  if (isObject(pat)) return routeObject(pat, obj, blists);
  if (isVar(pat)) return updateBlists(pat, obj, blists);
  return pat === obj ? blists : [];
};
