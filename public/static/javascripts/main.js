const router = new Router({
    container: '#root',
    routes: {
        signin: SignInScreen,
        question: QuestionScreen
    },
    initial: 'signin'
});


function SignInScreen() {
    const auth = firebase.auth();
    const handleAuthStateChanged = auth.onAuthStateChanged((user) => {
        if (user) {
            router.navigate('question');
        }
    });
    const handleClick = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider);
    };

    this.template = 'template#signin-screen';

    this.ready = function() {
        this.loginBtn = document.querySelector('.login-btn');
        this.loginBtn.addEventListener('click', handleClick);
    };

    this.destroy = function() {
        this.loginBtn.removeEventListener('click', handleClick);
        handleAuthStateChanged();
    };
}


function QuestionScreen() {
    const database = firebase.database();
    const handleRefOnValue = (snapshot) => {
        console.log(snapshot.val());
    };

    this.template = 'template#question-screen';

    this.ready = function() {
        database.ref('active-question').on('value', handleRefOnValue);
    };

    this.destroy = function() {
        database.ref('active-question').off('value', handleRefOnValue);
    };
}
