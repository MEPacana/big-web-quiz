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
        const email = e.target.email.value;
        const password = e.target.password.value;
        auth.signInWithEmailAndPassword(email, password);
    };

    this.template = 'template#signin-screen';

    this.ready = function() {
        this.signInForm = $('form');
        this.signInForm.addEventListener('submit', handleSubmit);
    };

    this.destroy = function() {
        this.signInForm.removeEventListener('submit', handleSubmit);
        handleAuthStateChanged();
    };
}


function AdminScreen() {
    const database = firebase.database();
    const questions = {};

    function resetForm() {
        $('form').question.value = '';
        $('#choices').innerHTML = '';
        for (let i = 0; i < 2; i++) {
            insertChoice();
        }
    }
    function insertChoice(choice={}) {
        const choiceTmpl = $('template#choice').innerHTML;
        const rendered = element(choiceTmpl);
        $('input[type="text"]', rendered).value = choice.text || '';
        $('input[type="radio"]', rendered).checked = choice.correct;
        $('#choices').appendChild(rendered);
    }
    function handleSubmit(e) {
        e.preventDefault();
        const key = e.target.dataset.key;
        const text = e.target.question.value;
        const choices = $$('#choices li').map((choice) => {
            const text = $('input[type="text"]', choice).value;
            const correct = $('input[type="radio"]', choice).checked;
            return { text, correct };
        });
        if (key) {
            database.ref(`questions/${key}`).set({ text, choices }).then(resetForm);
        } else {
            database.ref('questions').push({ text, choices }).then(resetForm);
        }
    }
    function handleEdit(e) {
        if (!e.target.matches('button.edit')) {
            return undefined;
        }
        const key = e.target.closest('li').dataset.key;
        editQuestion(key, questions[key]);
    }
    function handleRefOnChildAdded(snapshot) {
        const question = snapshot.val();
        const rendered = renderQuestion(snapshot.key, question);
        const $questions = $('.questions');
        if ($questions.children.length > 0) {
            $questions.insertBefore(rendered, $questions.firstElementChild);
        } else {
            $questions.appendChild(rendered);
        }
        questions[snapshot.key] = question;
    }
    function handleRefOnChildChanged(snapshot) {
        const question = snapshot.val();
        const rendered = renderQuestion(snapshot.key, question);
        const $questions = $('.questions');
        const oldQuestion = $(`[data-key="${snapshot.key}"]`, $questions);
        $questions.replaceChild(rendered, oldQuestion);
        questions[snapshot.key] = question;
    }
    function renderQuestion(key, question) {
        const questionTmpl = $('template#question').innerHTML;
        const rendered = element(questionTmpl);
        rendered.dataset.key = key;
        $('p', rendered).textContent = question.text;
        question.choices.forEach((item) => {
            const choice = document.createElement('li');
            choice.textContent = item.text;
            if (item.correct) {
                choice.classList.add('correct');
            }
            $('ol', rendered).appendChild(choice);
        });
        return rendered;
    }
    function editQuestion(key, question) {
        $('form').question.value = question.text;
        $('form').dataset.key = key;
        $('#choices').innerHTML = '';
        question.choices.forEach(insertChoice);
    }

    this.template = 'template#admin-screen';

    this.ready = function() {
        resetForm();
        $('button[type="button"]').addEventListener('click', insertChoice);
        $('form').addEventListener('submit', handleSubmit);
        database.ref('questions').on('child_added', handleRefOnChildAdded);
        database.ref('questions').on('child_changed', handleRefOnChildChanged);
        document.addEventListener('click', handleEdit);
    };

    this.destroy = function() {
        $('button[type="button"]').removeEventListener('click', insertChoice);
        $('form').removeEventListener('submit', handleSubmit);
        database.ref('questions').off('child_added', handleRefOnChildAdded);
        database.ref('questions').off('child_changed', handleRefOnChildChanged);
        document.removeEventListener('click', handleEdit);
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
