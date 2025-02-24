const express = require('express');
const SimpleJsonDB = require('simple-json-db');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const ngrok = require('ngrok');
require('dotenv').config();

process.env.ADMIN_PASSWORD = 'Feb222025!';

const app = express();
const port = 3000;
const dbPath = path.resolve('./scores.json');
const db = new SimpleJsonDB(dbPath);

app.use(cors()); // Enable CORS
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to serve scores.json
app.get('/scores.json', (req, res) => {
  res.sendFile(path.resolve('./scores.json'));
});

// Endpoint to get the public URL
app.get('/public-url', (req, res) => {
  res.json({ publicUrl: process.env.PUBLIC_URL });
});

// Function to generate a scrambled word
function generateScrambledWord(word) {
  let scrambledWord;
  let attempts = 0;
  do {
    scrambledWord = word.split('').sort(() => 0.5 - Math.random()).join('').toUpperCase();
    attempts++;
    if (attempts >= 10) {
      return null; // Indicate that a new word should be selected
    }
  } while (scrambledWord === word.toUpperCase() || scrambledWord === word.split('').reverse().join('').toUpperCase() || !isScrambledEnough(word, scrambledWord));
  return scrambledWord;
}

// Function to check if the scrambled word is sufficiently different from the original
function isScrambledEnough(original, scrambled) {
  let same = 0;
  for (let i = 0; i < original.length; i++) {
    if (original[i].toUpperCase() == scrambled[i].toUpperCase()) {
      same++;
    }
  }
  return same <= 0;
}

// Endpoint to create or sign in to a player profile
app.post('/create-profile', (req, res) => {
  const { teamName, pin, teamMembers } = req.body;
  const lowerCaseTeamName = teamName.trim().toLowerCase();

  // Check if the PIN is already in use
  const teams = db.JSON();
  for (const team in teams) {
    if (teams[team].pin === pin) {
      return res.status(400).json({ message: 'PIN already in use' });
    }
  }

  if (db.has(lowerCaseTeamName)) {
    return res.status(400).json({ message: 'Team already exists' });
  }

  const words = JSON.parse(fs.readFileSync(path.resolve('./words.json'))).words;
  let newWord, newScrambledWord;
  do {
    newWord = words[Math.floor(Math.random() * words.length)];
    newScrambledWord = generateScrambledWord(newWord);
  } while (!newScrambledWord);
  db.set(lowerCaseTeamName, { score: 0, pin, teamMembers, currentWord: newWord, scrambledWord: newScrambledWord, skips: 5, unjumbles: 1 });
  res.status(201).json({ message: 'Profile created', team: { score: 0, pin, teamMembers, currentWord: newWord, scrambledWord: newScrambledWord, skips: 5, unjumbles: 1 } });
});

// Endpoint to sign in to a player profile
app.post('/sign-in', (req, res) => {
  const { teamName, pin } = req.body;
  const lowerCaseTeamName = teamName.trim().toLowerCase(); // Ensure team name is normalized
  if (db.has(lowerCaseTeamName)) {
    const team = db.get(lowerCaseTeamName);
    if (team.pin === pin) {
      return res.status(200).json({ message: 'Signed in', team });
    } else {
      return res.status(403).json({ message: 'Invalid PIN' });
    }
  } else {
    return res.status(400).json({ message: 'Team not found' });
  }
});

// Endpoint to check the answer
app.post('/check-answer', (req, res) => {
  const { teamName, pin, answer } = req.body;
  const lowerCaseTeamName = teamName.toLowerCase();
  // console.log('Received request to check answer:', req.body); // Log the request body
  if (!db.has(lowerCaseTeamName)) {
    return res.status(400).json({ message: 'Team not found' });
  }
  const team = db.get(lowerCaseTeamName);
  if (team.pin !== pin) {
    return res.status(403).json({ message: 'Invalid PIN' });
  }
  const words = JSON.parse(fs.readFileSync(path.resolve('./words.json'))).words;
  const correctWord = team.currentWord.toUpperCase() === answer.toUpperCase();
  if (correctWord) {
    team.score += 1;
    let newWord, newScrambledWord;
    do {
      newWord = words[Math.floor(Math.random() * words.length)];
      newScrambledWord = generateScrambledWord(newWord);
    } while (!newScrambledWord);
    team.currentWord = newWord;
    team.scrambledWord = newScrambledWord;
    db.set(lowerCaseTeamName, team);
    return res.status(200).json({ message: 'Correct', score: team.score, scrambledWord: newScrambledWord });
  } else {
    return res.status(200).json({ message: 'Incorrect' });
  }
});

app.post('/skip-word', (req, res) => {
  const { teamName, pin } = req.body;
  const lowerCaseTeamName = teamName.toLowerCase();
  if (!db.has(lowerCaseTeamName)) {
    return res.status(400).json({ message: 'Team not found' });
  }
  const team = db.get(lowerCaseTeamName);
  if (team.pin !== pin) {
    return res.status(403).json({ message: 'Invalid PIN' });
  }
  if (team.skips <= 0) {
    return res.status(400).json({ message: 'No skips remaining' });
  }
  const words = JSON.parse(fs.readFileSync(path.resolve('./words.json'))).words;
  let newWord, newScrambledWord;
  do {
    newWord = words[Math.floor(Math.random() * words.length)];
    newScrambledWord = generateScrambledWord(newWord);
  } while (!newScrambledWord);
  team.currentWord = newWord;
  team.scrambledWord = newScrambledWord;
  team.skips -= 1;
  db.set(lowerCaseTeamName, team);
  res.status(200).json({ scrambledWord: newScrambledWord, remainingSkips: team.skips });
});

app.post('/unjumble-word', (req, res) => {
  const { teamName, pin } = req.body;
  const lowerCaseTeamName = teamName.toLowerCase();
  if (!db.has(lowerCaseTeamName)) {
    return res.status(400).json({ message: 'Team not found' });
  }
  const team = db.get(lowerCaseTeamName);
  if (team.pin !== pin) {
    return res.status(403).json({ message: 'Invalid PIN' });
  }
  if (team.unjumbles <= 0) {
    return res.status(400).json({ message: 'No unjumbles remaining' });
  }
  const word = team.currentWord.toUpperCase();
  const middleIndex = Math.floor(word.length / 2);
  const unjumbledWord = `${word[0]} ${'_ '.repeat(middleIndex - 1)}${word[middleIndex]} ${'_ '.repeat(word.length - middleIndex - 2)}${word[word.length - 1]}`;
  team.unjumbles -= 1;
  db.set(lowerCaseTeamName, team);
  res.status(200).json({ unjumbledWord });
});

app.post('/reset-skips-unjumbles', (req, res) => {
  const { password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ message: 'Invalid password' });
  }
  const words = JSON.parse(fs.readFileSync(path.resolve('./words.json'))).words;
  const teams = db.JSON();
  for (const teamName in teams) {
    const team = teams[teamName];
    team.skips = 5;
    team.unjumbles = 1;
    team.score = 0;
    let newWord, newScrambledWord;
    do {
      newWord = words[Math.floor(Math.random() * words.length)];
      newScrambledWord = generateScrambledWord(newWord);
    } while (!newScrambledWord);
    team.currentWord = newWord;
    team.scrambledWord = newScrambledWord;
    db.set(teamName, team);
  }
  res.status(200).json({ message: 'Game reset for all teams' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://192.168.1.114:${port}`);
  
  ngrok.connect(port).then(url => {
    console.log(`Server is publicly accessible at ${url}`);
    process.env.PUBLIC_URL = url;
    console.log("------------------------------------------------------------");
    console.log(`Scoreboard available at http://192.168.1.114:${port}/src/scoreboard-123563543.html`);
    console.log(`QR Code Generator available at http://192.168.1.114:${port}/src/qr_code-8347239484.html`);
  });
});

