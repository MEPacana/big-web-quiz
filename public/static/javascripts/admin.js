const router = new Router({
    container: '#root',
    routes: {
        signin: SignInScreen,
        admin: AdminScreen
    },
    initial: 'signin'
});


function SignInScreen() {
    const auth = firebase.auth();
    const handleAuthStateChanged = auth.onAuthStateChanged((user) => {
        if (user && user.email === 'admin@gdgcebu.org') {
            router.navigate('admin');
        }
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        const email = e.target.querySelector('#email').value;
        const password = e.target.querySelector('#password').value;
        auth.signInWithEmailAndPassword(email, password);
    };

    this.template = 'template#signin-screen';

    this.ready = function() {
        this.signInForm = document.querySelector('form');
        this.signInForm.addEventListener('submit', handleSubmit);
    };

    this.destroy = function() {
        this.signInForm.removeEventListener('submit', handleSubmit);
        handleAuthStateChanged();
    };
}


function AdminScreen() {
    this.template = 'template#admin-screen';

    this.ready = function() {};

    this.destroy = function() {};
}
