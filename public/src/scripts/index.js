document.getElementById('login-team-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const teamName = document.getElementById('login-team-name').value.trim().toLowerCase();
  const pin = document.getElementById('login-team-pin').value;

  try {
    const response = await fetch('/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName, pin })
    });

    const result = await response.json();
    if (response.ok) {
      document.getElementById('login-form').style.display = 'none';
      document.getElementById('game-form').style.display = 'block';
      document.getElementById('answer').focus();
      if (result.team && result.team.scrambledWord) {
        displayQuestion(result.team.scrambledWord);
      } else {
        generateQuestion();
      }
      document.getElementById('skip-button').textContent = `Skip: ${result.team.skips}`;
      document.getElementById('skip-button').disabled = result.team.skips <= 0;
      document.getElementById('unjumble-button').disabled = result.team.unjumbles <= 0;
      localStorage.setItem('teamName', teamName);
      localStorage.setItem('pin', pin);
    } else {
      alert(result.message || 'Error signing in');
      document.getElementById('login-team-name').value = '';
      document.getElementById('login-team-pin').value = '';
      document.getElementById('login-team-name').focus();
    }
  } catch (error) {
    console.error('Error signing in:', error);
    alert('Error signing in');
    document.getElementById('login-team-name').value = '';
    document.getElementById('login-team-pin').value = '';
    document.getElementById('login-team-name').focus();
  }
});

document.getElementById('create-team-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const teamName = document.getElementById('create-team-name').value.trim().toLowerCase();
  const teamMembers = document.getElementById('team-members').value.split(',').map(member => member.trim());
  const pin = document.getElementById('create-team-pin').value;
  const repeatPin = document.getElementById('repeat-team-pin').value;

  if (pin !== repeatPin) {
    alert('PINs do not match');
    return;
  }

  try {
    const response = await fetch('/create-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName, pin, teamMembers })
    });

    const result = await response.json();
    if (response.ok) {
      document.getElementById('create-team-form').style.display = 'none';
      document.getElementById('game-form').style.display = 'block';
      document.getElementById('answer').focus();
      if (result.team && result.team.scrambledWord) {
        displayQuestion(result.team.scrambledWord);
      } else {
        generateQuestion();
      }
      document.getElementById('skip-button').textContent = `Skip: ${result.team.skips}`;
      document.getElementById('skip-button').disabled = result.team.skips <= 0;
      document.getElementById('unjumble-button').disabled = result.team.unjumbles <= 0;
      localStorage.setItem('teamName', teamName);
      localStorage.setItem('pin', pin);
    } else {
      alert(result.message || 'Error creating profile');
    }
  } catch (error) {
    console.error('Error creating profile:', error);
    alert('Error creating profile');
  }
});

document.getElementById('answer-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const teamName = localStorage.getItem('teamName');
  const pin = localStorage.getItem('pin');
  const answer = document.getElementById('answer').value;
  const scrambledWord = document.getElementById('question').dataset.scrambledWord;

  const response = await fetch('/check-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamName, pin, answer, scrambledWord })
  });

  const result = await response.json();
  const feedback = document.getElementById('feedback');
  feedback.style.display = 'block';
  if (result.message === 'Correct') {
    feedback.textContent = 'Correct!';
    setTimeout(() => feedback.style.display = 'none', 2000);
    displayQuestion(result.scrambledWord);
  } else {
    feedback.textContent = 'Incorrect!';
    setTimeout(() => feedback.style.display = 'none', 2000);
  }
  document.getElementById('answer').value = '';
  document.getElementById('answer').focus();
});

document.getElementById('skip-button').addEventListener('click', async () => {
  const teamName = localStorage.getItem('teamName');
  const pin = localStorage.getItem('pin');

  try {
    const response = await fetch('/skip-word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName, pin })
    });

    const result = await response.json();
    if (response.ok) {
      displayQuestion(result.scrambledWord);
      document.getElementById('skip-button').textContent = `Skip: ${result.remainingSkips}`;
      if (result.remainingSkips <= 0) {
        document.getElementById('skip-button').disabled = true;
      }
    } else {
      alert(result.message || 'Error skipping word');
    }
  } catch (error) {
    console.error('Error skipping word:', error);
    alert('Error skipping word');
  }
});

document.getElementById('unjumble-button').addEventListener('click', async () => {
  const teamName = localStorage.getItem('teamName');
  const pin = localStorage.getItem('pin');

  try {
    const response = await fetch('/unjumble-word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName, pin })
    });

    const result = await response.json();
    if (response.ok) {
      const unjumbledWord = result.unjumbledWord;
      document.getElementById('unjumbled-word').textContent = unjumbledWord;
      document.getElementById('unjumble-button').disabled = true;
    } else {
      alert(result.message || 'Error unjumbling word');
    }
  } catch (error) {
    console.error('Error unjumbling word:', error);
    alert('Error unjumbling word');
  }
});

async function generateQuestion() {
  const response = await fetch('/words.json');
  const data = await response.json();
  const words = data.words;
  const randomWord = words[Math.floor(Math.random() * words.length)];
  const scrambledWord = randomWord.split('').sort(() => 0.5 - Math.random()).join('').toUpperCase();
  displayQuestion(scrambledWord);

  const teamName = localStorage.getItem('teamName');
  const pin = localStorage.getItem('pin');
  await fetch('/update-current-word', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamName, pin, scrambledWord, currentWord: randomWord })
  });

  const profileResponse = await fetch('/sign-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamName, pin })
  });

  const profileResult = await profileResponse.json();
  if (profileResponse.ok) {
    document.getElementById('skip-button').textContent = `Skip: ${profileResult.team.skips}`;
    document.getElementById('skip-button').disabled = profileResult.team.skips <= 0;
    document.getElementById('unjumble-button').disabled = profileResult.team.unjumbles <= 0;
  } else {
    alert(profileResult.message || 'Error fetching profile');
  }

  document.getElementById('unjumbled-word').textContent = '';
}

function displayQuestion(scrambledWord) {
  const question = document.getElementById('question');
  question.innerHTML = `What is the word: <span style="color:rgb(25, 221, 25);">${scrambledWord}</span>?`; // Forest green color for scrambled word
  question.dataset.scrambledWord = scrambledWord;
  document.getElementById('unjumbled-word').textContent = '';
}
