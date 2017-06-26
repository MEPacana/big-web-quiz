const router = new Router({
    container: '#root',
    routes: {
        signin: 'template#signin-screen',
        question: 'template#question-screen'
    },
    initial: 'signin'
});


const auth = firebase.auth();
const database = firebase.database();

auth.onAuthStateChanged((user) => {
    if (user) {
        router.navigate('question');
        database.ref('active-question').on('value', (snapshot) => (
            displayQuestion(snapshot.val())
        ));
    }
});


const loginBtn = document.querySelector('.login-btn');
const questionScreen = document.querySelector('.question-screen');

loginBtn.addEventListener('click', (e) => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
});


function displayQuestion(question) {
    if (!question) {
        return undefined;
    }
    console.log(question);
}
