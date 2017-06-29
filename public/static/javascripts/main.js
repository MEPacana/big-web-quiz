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
        const question = snapshot.val();
        if (question) {
            displayActiveQuestion(question);
        } else {
            displayNoActiveQuestion();
        }
    };
    function displayActiveQuestion(question) {
        const container = $('#root');
        container.innerHTML = '';
        const questionTmpl = $('template#active-question').innerHTML;
        const choiceTmpl = $('template#choice').innerHTML;
        const rendered = element(questionTmpl);
        $('h1', rendered).textContent = question.text;
        question.choices.forEach((choice, i) => {
            const li = element(choiceTmpl);
            $('span', li).textContent = choice.text;
            $('input', li).value = i;
            $('ol', rendered).appendChild(li);
        });
        container.appendChild(rendered);
    }
    function displayNoActiveQuestion() {

    }

    this.template = 'template#question-screen';

    this.ready = function() {
        database.ref('active-question').on('value', handleRefOnValue);
    };

    this.destroy = function() {
        database.ref('active-question').off('value', handleRefOnValue);
    };
}


function $(selector, context=document) {
    return context.querySelector(selector);
}

function $$(selector, context=document) {
    return Array.from(context.querySelectorAll(selector));
}

function element(template, stage) {
    stage = stage || document.createElement('div');
    stage.innerHTML = template;
    return stage.firstElementChild;
}
