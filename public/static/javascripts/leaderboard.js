const database = firebase.database();
const list = document.querySelector('ol');

database.ref('leaderboard').orderByPriority().on('value', (snapshot) => {
    list.innerHTML = '';
    snapshot.forEach((item) => {
        const data = item.val();
        const li = document.createElement('li');
        li.textContent = `${data.name} (${data.score})`;
        list.appendChild(li);
    });
});
