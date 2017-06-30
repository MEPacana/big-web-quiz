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
    const auth = firebase.auth();
    const database = firebase.database();

    const handleRefOnValue = (snapshot) => {
        const question = snapshot.val();
        if (question) {
            const key = question.key;
            const user = auth.currentUser.uid;
            database.ref(`users/${user}/answers/${key}`)
                .once('value', (snapshot) => {
                    displayActiveQuestion(question);
                    const answer = snapshot.val();
                    if (answer) {
                        activeQuestionAnswered(answer);
                    }
                });
        } else {
            displayNoActiveQuestion();
        }
    };
    function handleSubmit(e) {
        e.preventDefault();
        const answer = e.target.choice.value;
        const key = e.target.dataset.key;
        const user = auth.currentUser.uid;
        if (!answer) {
            return undefined;
        }
        const ref = `users/${user}/answers/${key}`;
        database.ref(ref).set(answer)
            .then(() => activeQuestionAnswered(answer));
    }
    function handleClick(e) {
        if (!e.target.matches('button.subscribe')) {
            return undefined;
        }
        navigator.serviceWorker.getRegistration().then((registration) => {
            registration.pushManager.getSubscription().then((subscription) => {
                const user = auth.currentUser.uid;
                if (subscription) {
                    unsubscribeFromPushNotifications(subscription);
                } else {
                    subscribeToPushNotifications(registration);
                }
            });
        });
    }
    function displayActiveQuestion(question) {
        const container = $('#root');
        const questionTmpl = $('template#active-question').innerHTML;
        const choiceTmpl = $('template#choice').innerHTML;
        const rendered = element(questionTmpl);
        rendered.dataset.key = question.key;
        $('h1', rendered).textContent = question.text;
        question.choices.forEach((choice, i) => {
            const li = element(choiceTmpl);
            $('span', li).textContent = choice.text;
            $('input', li).value = i;
            $('ol', rendered).appendChild(li);
        });
        container.replaceChild(rendered, container.firstElementChild);
    }
    function displayNoActiveQuestion() {
        const container = $('#root');
        const rendered = document.createElement('p');
        rendered.textContent = 'No active question at the moment.';
        container.replaceChild(rendered, container.firstElementChild);
    }
    function activeQuestionAnswered(answer) {
        const form = $('form');
        const selected = $(`input[value="${answer}"]`, form);
        selected.checked = true;
        selected.closest('li').classList.add('selected');
        $$('input[type="radio"]', form)
            .forEach((choice) => choice.disabled = true);
        $('button', form).remove();
    }
    function displayPushNotificationButton(subscribed) {
        const subscribeButton = $('button.subscribe');
        if (subscribed) {
            subscribeButton.textContent = 'Stop Notifying Me';
        } else {
            subscribeButton.textContent = 'Notify Me';
        }
    }
    function subscribeToPushNotifications(registration) {
        const user = auth.currentUser.uid;
        if (Notification.permission === 'granted') {
            handleNotificationPermission();
        } else if (Notification.permission === 'default')  {
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    handleNotificationPermission();
                }
            });
        }
        function handleNotificationPermission() {
            registration.pushManager.subscribe({ userVisibleOnly: true }).then((subscription) => {
                database.ref(`users/${user}/subscription`).set(subscription.toJSON())
                displayPushNotificationButton(true);
            });
        }
    }
    function unsubscribeFromPushNotifications(subscription) {
        subscription.unsubscribe();
        database.ref(`users/${user}/subscription`).remove();
        displayPushNotificationButton(false);
    }

    this.template = 'template#question-screen';

    this.ready = function() {
        database.ref('active-question').on('value', handleRefOnValue);
        document.addEventListener('submit', handleSubmit);
        document.addEventListener('click', handleClick);
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then((registration) => {
                registration.pushManager.getSubscription().then((subscription) => {
                    if (subscription) {
                        displayPushNotificationButton(true);
                    } else {
                        displayPushNotificationButton(false);
                    }
                });
            });
        }
    };

    this.destroy = function() {
        database.ref('active-question').off('value', handleRefOnValue);
        document.removeEventListener('submit', handleSubmit);
        document.removeEventListener('click', handleClick);
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
