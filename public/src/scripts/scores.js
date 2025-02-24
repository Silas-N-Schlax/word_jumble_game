document.addEventListener('DOMContentLoaded', () => {
  fetch('/scores.json')
    .then(response => response.json())
    .then(data => {
      const scoreboard = document.getElementById('scoreboard');
      const sortedTeams = Object.keys(data).sort((a, b) => data[b].score - data[a].score); // Sort teams by score

      sortedTeams.forEach(teamName => {
        const team = data[teamName];
        const item = document.createElement('div');
        item.className = 'scoreboard-item';

        const header = document.createElement('div');
        header.className = 'header';

        const teamNameDiv = document.createElement('div');
        teamNameDiv.className = 'team-name';
        teamNameDiv.textContent = teamName.replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter of each word
        teamNameDiv.style.float = 'left'; // Ensure team names are on the far left side

        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'score';
        scoreDiv.textContent = team.score;
        scoreDiv.style.fontWeight = 'bold';
        scoreDiv.style.paddingLeft = '5px';

        const arrow = document.createElement('span');
        arrow.className = 'arrow';
        arrow.textContent = '▶';
        arrow.addEventListener('click', () => {
          const membersList = item.querySelector('.team-members');
          if (membersList.style.display === 'none') {
            membersList.style.display = 'block';
            arrow.classList.add('down');
          } else {
            membersList.style.display = 'none';
            arrow.classList.remove('down');
          }
        });

        const membersList = document.createElement('ul');
        membersList.className = 'team-members';
        membersList.style.display = 'none';
        team.teamMembers.forEach(member => {
          const memberItem = document.createElement('li');
          memberItem.textContent = member;
          membersList.appendChild(memberItem);
        });

        header.appendChild(teamNameDiv);
        header.appendChild(scoreDiv);
        header.appendChild(arrow);
        item.appendChild(header);
        item.appendChild(membersList);
        scoreboard.appendChild(item);
      });
    })
    .catch(error => console.error('Error fetching scores:', error));
});
