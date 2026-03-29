/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
    plugins: [
        angular({ jit: true, tsconfig: 'tsconfig.spec.json' }),
    ],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['src/test-setup.js'],
        include: ['src/**/*.spec.ts'],
        server: {
            deps: {
                inline: [/^@angular/, /^@angular\/material/],
            },
        },
    },
});
