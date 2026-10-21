# Design it twice

Use when the user wants to compare ways to shape the one place before
building. The first idea is rarely the best.

## 1. Set out the problem

Before the sub-agents start, tell the user, in plain words:

- What any design must do, and which invariants and ADRs it must keep.
- What the code touches, by kind ([DEEPENING.md](DEEPENING.md)).
- A short code sketch to make the problem concrete. Not a proposal.

Then go straight to step 2. The user reads while the agents work.

## 2. Start three agents at once

Each gets the same brief (files, callers, what the code touches, the
`floc/CONTEXT.md` words to use, the home table in [SKILL.md](SKILL.md)) and
one different goal:

1. **Smallest:** one to three functions. Callers learn as little as possible.
2. **Most common caller first:** the usual call is one line; rare cases
   cost more.
3. **Web and phone:** shaped so `floc-web` and `floc-mobile` both call it
   the same way, with no app-specific argument.

Each returns:

1. What a caller must know: types, functions, rules, error cases (a
   rejection is a form error, never a throw).
2. One real call from a real screen.
3. What it hides.
4. How it is tested, by kind.
5. Where it is strong and where it is weak.

## 3. Compare

Show each design in turn, then compare in plain words: how much a caller must
know, where a future fix would land, which tests survive. Then recommend one,
or a mix, and say why. Be decided; do not hand over a menu. Settle what is
left with `/floc:grill`.
