import neostandard, { resolveIgnoresFromGitignore } from 'neostandard'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  // `noStyle` hands every formatting decision to Prettier, so ESLint is left
  // to enforce correctness rules only and the two tools never disagree.
  ...neostandard({
    ts: true,
    noStyle: true,
    ignores: resolveIgnoresFromGitignore()
  }),
  reactHooks.configs.flat['recommended-latest'],
  {
    rules: {
      // Handlers here are named after what they do in the game — `restart`,
      // `tapFlask` — which reads better than a mechanical `handleX` prefix.
      'react/jsx-handler-names': 'off'
    }
  }
]
