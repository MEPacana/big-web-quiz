const auth = firebase.auth();

auth.onAuthStateChanged((user) => {
    if (user) {
        console.log(user);
    }
});


const loginBtn = document.querySelector('.login-btn');

loginBtn.addEventListener('click', (e) => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
});
