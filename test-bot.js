const axios = require('axios');
const fs = require('fs');
const path = require('path');

const baseURL = 'http://127.0.0.1:3000'; // Use 127.0.0.1 instead of localhost
const scoresPath = path.resolve('./scores.json');

async function testSignIn(teamName, pin) {
  try {
    const response = await axios.post(`${baseURL}/sign-in`, { teamName, pin });
    console.log(`Sign-in for \x1b[35m${teamName}\x1b[0m:`, response.data);
  } catch (error) {
    console.error(`Error signing in for \x1b[35m${teamName}\x1b[0m:`, error.response ? error.response.data : error.message);
  }
}

async function testCreateProfile(teamName, pin, teamMembers) {
  try {
    const response = await axios.post(`${baseURL}/create-profile`, { teamName, pin, teamMembers });
    console.log(`Create profile for \x1b[35m${teamName}\x1b[0m:`, response.data);
  } catch (error) {
    console.error(`Error creating profile for \x1b[35m${teamName}\x1b[0m:`, error.response ? error.response.data : error.message);
  }
}

async function testCheckAnswer(teamName, pin) {
  let scores = JSON.parse(fs.readFileSync(scoresPath, 'utf8'));
  let team = scores[teamName];
  if (!team) {
    console.error(`Team \x1b[35m${teamName}\x1b[0m not found in scores.json`);
    return;
  }

  console.log(`Testing answers for \x1b[35m${teamName}\x1b[0m:`);
  for (let i = 0; i < 100; i++) {
    const answer = team.currentWord; // Use the current word as the correct answer
    try {
      const response = await axios.post(`${baseURL}/check-answer`, { teamName, pin, answer });
      if (response.data.message === 'Correct') {
        process.stdout.write('\x1b[32m.\x1b[0m'); // Green dot for correct answer
        // Fetch the updated team profile
        const profileResponse = await axios.post(`${baseURL}/sign-in`, { teamName, pin });
        team = profileResponse.data.team;
      } else {
        process.stdout.write('\x1b[31mx\x1b[0m'); // Red x for incorrect answer
      }
    } catch (error) {
      console.error(`Error checking answer for \x1b[35m${teamName}\x1b[0m on iteration ${i + 1}:`, error.response ? error.response.data : error.message);
      process.stdout.write('\x1b[33me\x1b[0m'); // Yellow e for error
    }
  }
  console.log(); // New line after 50 iterations
}

async function testSkipWord(teamName, pin) {
  console.log(`Testing skip word for \x1b[35m${teamName}\x1b[0m:`);
  for (let i = 0; i < 6; i++) {
    try {
      const response = await axios.post(`${baseURL}/skip-word`, { teamName, pin });
      if (response.data.remainingSkips >= 0) {
        process.stdout.write('\x1b[32m.\x1b[0m'); // Green dot for successful skip
      } else {
        process.stdout.write('\x1b[31mx\x1b[0m'); // Red x for no skips remaining
      }
    } catch (error) {
      if (error.response && error.response.data.message === 'No skips remaining') {
        process.stdout.write('\x1b[34m$\x1b[0m'); // Blue $ for no skips remaining
      } else {
        console.error(`Error skipping word for \x1b[35m${teamName}\x1b[0m on attempt ${i + 1}:`, error.response ? error.response.data : error.message);
        process.stdout.write('\x1b[33me\x1b[0m'); // Yellow e for error
      }
    }
  }
  console.log(); // New line after 6 attempts
}

async function testUnjumbleWord(teamName, pin) {
  console.log(`Testing unjumble word for \x1b[35m${teamName}\x1b[0m:`);
  for (let i = 0; i < 2; i++) {
    try {
      const response = await axios.post(`${baseURL}/unjumble-word`, { teamName, pin });
      if (response.data.unjumbledWord) {
        process.stdout.write('\x1b[32m.\x1b[0m'); // Green dot for successful unjumble
      } else {
        process.stdout.write('\x1b[31mx\x1b[0m'); // Red x for no unjumbles remaining
      }
    } catch (error) {
      if (error.response && error.response.data.message === 'No unjumbles remaining') {
        process.stdout.write('\x1b[34m$\x1b[0m'); // Blue $ for no unjumbles remaining
      } else {
        console.error(`Error unjumbling word for \x1b[35m${teamName}\x1b[0m on attempt ${i + 1}:`, error.response ? error.response.data : error.message);
        process.stdout.write('\x1b[33me\x1b[0m'); // Yellow e for error
      }
    }
  }
  console.log(); // New line after 2 attempts
}

async function testIncorrectAnswer(teamName, pin) {
  console.log(`Testing incorrect answers for \x1b[35m${teamName}\x1b[0m:`);
  for (let i = 0; i < 100; i++) {
    const incorrectAnswer = 'wronganswer'; // Use a static incorrect answer
    try {
      const response = await axios.post(`${baseURL}/check-answer`, { teamName, pin, answer: incorrectAnswer });
      if (response.data.message === 'Incorrect') {
        process.stdout.write('\x1b[35m.\x1b[0m'); // Purple dot for incorrect answer
      } else {
        process.stdout.write('\x1b[33mp\x1b[0m'); // Orange p for unexpected correct answer
      }
    } catch (error) {
      console.error(`Error checking incorrect answer for \x1b[35m${teamName}\x1b[0m on iteration ${i + 1}:`, error.response ? error.response.data : error.message);
      process.stdout.write('\x1b[31mx\x1b[0m'); // Red x for other errors
    }
  }
  console.log(); // New line after 50 iterations
}

async function runTests() {
  // Test sign-in with various inputs
  await testSignIn('silas', '1111');
  await testSignIn('gargo', '1202');
  await testSignIn('mom', '1234');
  await testSignIn('test1', '2222');
  await testSignIn('schlax', '2006');
  await testSignIn('teste', '3333');

  // Test create profile with various inputs
  // await testCreateProfile('team', '4444', ['Alice', 'Bob']); // Testing creating of new team
  // await testCreateProfile('team', '4444', ['Alice', 'Bob']); // Testing creating of new team with same name
  // await testCreateProfile('team11', '4444', ['Alice', 'Bob']); // Testing creating of new team with different name and same pin
  // await testCreateProfile('anotherteam', '5555', ['Charlie', 'Dave']); //Testing creating of new team with different name and pin

  // Test check answer with various inputs
  await testCheckAnswer('silas', '1111');
  await testCheckAnswer('gargo', '1202');
  await testCheckAnswer('mom', '1234');
  await testCheckAnswer('test1', '2222');
  await testCheckAnswer('schlax', '2006');
  await testCheckAnswer('teste', '3333');

  // Test skip word with various inputs
  await testSkipWord('silas', '1111');
  await testSkipWord('gargo', '1202');
  await testSkipWord('mom', '1234');
  await testSkipWord('test1', '2222');
  await testSkipWord('schlax', '2006');
  await testSkipWord('teste', '3333');

  // Test unjumble word with various inputs
  await testUnjumbleWord('silas', '1111');
  await testUnjumbleWord('gargo', '1202');
  await testUnjumbleWord('mom', '1234');
  await testUnjumbleWord('test1', '2222');
  await testUnjumbleWord('schlax', '2006');
  await testUnjumbleWord('teste', '3333');

  // Test incorrect answers with various inputs
  await testIncorrectAnswer('silas', '1111');
  await testIncorrectAnswer('gargo', '1202');
  await testIncorrectAnswer('mom', '1234');
  await testIncorrectAnswer('test1', '2222');
  await testIncorrectAnswer('schlax', '2006');
  await testIncorrectAnswer('teste', '3333');
}

runTests();
