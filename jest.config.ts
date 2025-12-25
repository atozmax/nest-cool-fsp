import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.spec.ts'],
    moduleFileExtensions: ['ts', 'js'],
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/index.ts',
    ],
};

export default config;
