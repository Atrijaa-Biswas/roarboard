const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const targetEmail = "atrijaabiswas2007@gmail.com";

async function makeAdmin() {
  let userRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(targetEmail);
    console.log("User found via email. Updating admin claim...");
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log("User not registered in Auth system yet. Creating account preemptively...");
      userRecord = await admin.auth().createUser({
        email: targetEmail,
        emailVerified: true
      });
    } else {
      console.error("Error fetching user:", error);
      process.exit(1);
    }
  }

  await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
  console.log(`\nSUCCESS! 🎉`);
  console.log(`Granted Admin privileges to ${targetEmail}.`);
  console.log(`You can now natively log into the Web App using Google Sign-In and you will have full Staff access!`);
  process.exit(0);
}

makeAdmin().catch(err => {
  console.error("Fatal exception:", err);
  process.exit(1);
});
