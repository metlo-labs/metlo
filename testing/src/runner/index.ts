import { TestConfig, TestResult } from "types/test"

export const runTest = (test: TestConfig): TestResult => {
    return {
        success: true,
        results: []
    }
}