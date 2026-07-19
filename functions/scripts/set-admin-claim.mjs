// Grants (or revokes) the `admin: true` custom claim used by firestore.rules
// and the admin panel — replaces the old hardcoded-email check.
//
// Run from inside functions/ after `npm install`:
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json \
//     node scripts/set-admin-claim.mjs --project petvid-82a98 --email someone@example.com [--revoke] [--dry-run]
//
// The signed-in user must sign out/in (or force-refresh their ID token) for
// the claim to take effect — custom claims only propagate on token refresh.

import admin from 'firebase-admin';

const args = process.argv.slice(2);
function flag(name) {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
}
const hasFlag = (name) => args.includes(`--${name}`);

const projectId = flag('project');
const email = flag('email');
const revoke = hasFlag('revoke');
const dryRun = hasFlag('dry-run');

if (!projectId) {
  console.error('Missing --project <firebase-project-id>. Refusing to run against an unspecified project.');
  process.exit(1);
}
if (!email) {
  console.error('Missing --email <user-email>.');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId });

const actualProjectId = admin.app().options.projectId;
if (actualProjectId !== projectId) {
  console.error(`Refusing to continue: credential resolves to project "${actualProjectId}", not "${projectId}".`);
  process.exit(1);
}

const user = await admin.auth().getUserByEmail(email);
const currentClaims = user.customClaims ?? {};
const nextClaims = { ...currentClaims, admin: revoke ? false : true };

console.log(`Project:        ${actualProjectId}`);
console.log(`User:           ${email} (${user.uid})`);
console.log(`Current claims: ${JSON.stringify(currentClaims)}`);
console.log(`Next claims:    ${JSON.stringify(nextClaims)}`);
console.log(`Action:         ${revoke ? 'REVOKE admin' : 'GRANT admin'}${dryRun ? '  [dry-run — no changes made]' : ''}`);

if (dryRun) {
  process.exit(0);
}

await admin.auth().setCustomUserClaims(user.uid, nextClaims);
console.log('✓ Custom claims updated. The user must sign out and back in (or force-refresh their ID token) to see the change.');
process.exit(0);
