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
    const auth = firebase.auth();
    const database = firebase.database();
    const questions = {};
    const handleAuthStateChanged = auth.onAuthStateChanged((user) => {
        if (!user || user.email !== 'admin@gdgcebu.org') {
            router.navigate('signin');
        }
    });

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
    function handleEditQuestion(e) {
        if (!e.target.matches('button.edit')) {
            return undefined;
        }
        const key = e.target.closest('li').dataset.key;
        editQuestion(key, questions[key]);
    }
    function handleRemoveQuestion(e) {
        if (!e.target.matches('.questions button.remove')) {
            return undefined;
        }
        const key = e.target.closest('li').dataset.key;
        database.ref(`questions/${key}`).remove();
    }
    function handleRemoveChoice(e) {
        if (!e.target.matches('#choices button.remove')) {
            return undefined;
        }
        e.target.closest('li').remove();
    }
    function handleRemoveActiveQuestion(e) {
        if (!e.target.matches('.active-question button.remove')) {
            return undefined;
        }
        database.ref('active-question').remove();
    }
    function handleMakeActiveQuestion(e) {
        if (!e.target.matches('button.activate')) {
            return undefined;
        }
        const key = e.target.closest('li').dataset.key;
        const question = Object.assign({}, questions[key]);
        question.choices = question.choices.map((choice) => {
            delete choice.correct;
            return choice;
        });
        question.key = key;
        database.ref('active-question').set(question);
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
    function handleRefOnChildRemoved(snapshot) {
        const $questions = $('.questions');
        $(`[data-key="${snapshot.key}"]`, $questions).remove();
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
    function handleActiveQuestionValue(snapshot) {
        const question = snapshot.val();
        let rendered;
        if (question) {
            const questionTmpl = $('template#active-question').innerHTML;
            rendered = element(questionTmpl);
            $('p', rendered).textContent = question.text;
            question.choices.forEach((item) => {
                const choice = document.createElement('li');
                choice.textContent = item.text;
                if (item.correct) {
                    choice.classList.add('correct');
                }
                $('ol', rendered).appendChild(choice);
            });
        } else {
            rendered = document.createElement('p');
            rendered.textContent = 'There is no active question.';
            rendered.classList.add('active-question');
        }
        if ($('.active-question')) {
            $('.admin-screen').replaceChild(rendered, $('.active-question'));
        } else {
            $('.admin-screen').insertBefore(rendered, $('form'));
        }
    }
    function handleSignOut(e) {
        if (!e.target.matches('button.signout')) {
            return undefined;
        }
        auth.signOut();
    }

    this.template = 'template#admin-screen';

    this.ready = function() {
        resetForm();
        $('button[type="button"]').addEventListener('click', insertChoice);
        $('form').addEventListener('submit', handleSubmit);
        database.ref('questions').on('child_added', handleRefOnChildAdded);
        database.ref('questions').on('child_changed', handleRefOnChildChanged);
        database.ref('questions').on('child_removed', handleRefOnChildRemoved);
        database.ref('active-question').on('value', handleActiveQuestionValue);
        document.addEventListener('click', handleEditQuestion);
        document.addEventListener('click', handleRemoveQuestion);
        document.addEventListener('click', handleRemoveChoice);
        document.addEventListener('click', handleRemoveActiveQuestion);
        document.addEventListener('click', handleMakeActiveQuestion);
        document.addEventListener('click', handleSignOut);
    };

    this.destroy = function() {
        $('button[type="button"]').removeEventListener('click', insertChoice);
        $('form').removeEventListener('submit', handleSubmit);
        database.ref('questions').off('child_added', handleRefOnChildAdded);
        database.ref('questions').off('child_changed', handleRefOnChildChanged);
        database.ref('questions').off('child_removed', handleRefOnChildRemoved);
        database.ref('active-question').off('value', handleActiveQuestionValue);
        document.removeEventListener('click', handleEditQuestion);
        document.removeEventListener('click', handleRemoveQuestion);
        document.removeEventListener('click', handleRemoveChoice);
        document.removeEventListener('click', handleRemoveActiveQuestion);
        document.removeEventListener('click', handleMakeActiveQuestion);
        document.removeEventListener('click', handleSignOut);
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
