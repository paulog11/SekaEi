import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    alias: {
      '~': resolve(__dirname, '.'),
    },
    projects: [
      {
        plugins: [vue()],
        test: {
          name: 'node',
          include: [
            'tests/unit/useWavEncoder.test.ts',
            'tests/unit/pcmCapture.test.ts',
            'tests/unit/azure.test.ts',
            'tests/unit/assess.post.test.ts',
            'tests/unit/passages.test.ts',
          ],
          environment: 'node',
        },
      },
      {
        plugins: [vue()],
        test: {
          name: 'dom',
          include: ['tests/unit/useRecorder.test.ts'],
          environment: 'happy-dom',
        },
      },
    ],
  },
})
