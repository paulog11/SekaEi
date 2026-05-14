import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

const alias = { '~': resolve(__dirname, '.') }

export default defineConfig({
  plugins: [vue()],
  resolve: { alias },
  test: {
    projects: [
      {
        plugins: [vue()],
        resolve: { alias },
        test: {
          name: 'node',
          include: [
            'tests/unit/useWavEncoder.test.ts',
            'tests/unit/pcmCapture.test.ts',
            'tests/unit/azure.test.ts',
            'tests/unit/assess.post.test.ts',
            'tests/unit/passages.test.ts',
            'tests/unit/me.get.test.ts',
            'tests/unit/attempts.post.test.ts',
            'tests/unit/attempts.get.test.ts',
            'tests/unit/flagDifficultWords.test.ts',
            'tests/unit/flaggedWords.post.test.ts',
            'tests/unit/coach.post.test.ts',
          ],
          environment: 'node',
        },
      },
      {
        plugins: [vue()],
        resolve: { alias },
        test: {
          name: 'dom',
          include: [
            'tests/unit/useRecorder.test.ts',
            'tests/unit/useHistory.test.ts',
          ],
          environment: 'happy-dom',
        },
      },
    ],
  },
})
