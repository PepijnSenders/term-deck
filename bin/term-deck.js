#!/usr/bin/env node
/**
 * JavaScript wrapper for term-deck CLI
 * Uses tsx to execute the TypeScript entry point
 */

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register tsx for TypeScript execution
register('tsx/esm', pathToFileURL('./'));

// Import and run the TypeScript CLI
await import('./term-deck.ts');
