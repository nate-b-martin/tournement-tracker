#!/usr/bin/env node
//
// generate-auth-keys.mjs — generate the RS256 keypair Convex Auth uses.
//
// Writes two files into the given output directory (never to stdout, so the
// secrets cannot end up in shell history or CI logs):
//
//   JWT_PRIVATE_KEY  PKCS8 PEM, newlines collapsed to spaces
//   JWKS             public JWK set in the shape Convex Auth expects
//
// Usage: node scripts/generate-auth-keys.mjs <output-dir>
//        bun  scripts/generate-auth-keys.mjs <output-dir>
//
// The deployment env vars are then set by scripts/convex-auth-env.sh. Keys are
// generated once and reused — regenerating them invalidates every session and
// issued JWT.

import { generateKeyPairSync } from "node:crypto";
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = process.argv[2];
if (!outDir) {
	console.error("usage: generate-auth-keys.mjs <output-dir>");
	process.exit(1);
}

mkdirSync(outDir, { recursive: true, mode: 0o700 });

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
	modulusLength: 2048,
});

const privatePem = privateKey
	.export({ type: "pkcs8", format: "pem" })
	.toString();
const jwk = publicKey.export({ format: "jwk" });
const jwks = JSON.stringify({ keys: [{ use: "sig", ...jwk }] });

const privatePath = join(outDir, "JWT_PRIVATE_KEY");
const jwksPath = join(outDir, "JWKS");

// Convex env values are stored as single-line strings. The Convex Auth wizard
// stores the PEM with spaces in place of newlines, and jose parses both forms.
writeFileSync(privatePath, privatePem.trimEnd().replace(/\n/g, " "), {
	mode: 0o600,
});
writeFileSync(jwksPath, jwks, { mode: 0o600 });

// `mode` on writeFileSync only applies when the file is created; enforce it on
// the off chance the target already existed.
chmodSync(privatePath, 0o600);
chmodSync(jwksPath, 0o600);

console.log(`✓ Wrote JWT_PRIVATE_KEY and JWKS to ${outDir}`);
