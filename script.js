document.addEventListener('DOMContentLoaded', () => {
    // --- LIBRARIES ---
    MicroModal.init({openClass: 'active', disableScroll: true});

    // --- STATE MANAGEMENT ---
    let flashcards = [];
    let forLater = [];
    let currentCardIndex = 0;
    let answeredItems = { correct: true, items: [] };
    let currentReviewDeck = [];
    let cardToRemove = { id: null, source: null };

    // --- DOM ELEMENTS ---
    // const mainContainer = document.getElementById('main-container');
    const navCreate = [document.getElementById('nav-create'), document.querySelector('.add-card')];
    const navReview = document.getElementById('nav-review');
    const navLater = document.getElementById('nav-later');
    const views = document.querySelectorAll('.view');
    
    // Create View
    const createForm = document.getElementById('create-form');
    const questionInput = document.getElementById('question');
    const questionTypeSelect = document.getElementById('question-type');
    const mcOptionsContainer = document.getElementById('mc-options-container');
    const mcOptionsList = document.getElementById('mc-options-list');
    const addOptionBtn = document.getElementById('add-option-btn');
    const answerInput = document.getElementById('answer');
    const answerItemContainers = {
        answerElem: document.getElementById('answer-container'),
        itemsElem: document.getElementById('enum-items-container')
    };
    const enumItemsList = document.getElementById('enum-items-list');
    const addItemBtn = document.getElementById('add-item-btn');
    const alternativesContainer = document.getElementById('alternatives-container');
    const alternativesList = document.getElementById('alternatives-list');
    const addAlternativeBtn = document.getElementById('add-alternative-btn');

    // Review View & Session
    const reviewManagementArea = document.getElementById('review-management-area');
    const reviewList = document.getElementById('review-list');
    const reviewListPlaceholder = document.getElementById('review-list-placeholder');
    const startReviewBtn = document.getElementById('start-review-btn');
    const reviewCardContainer = document.getElementById('review-card-container');
    const reviewProgress = document.getElementById('review-progress');
    const reviewQuestion = document.getElementById('review-question');
    const reviewAnswerArea = document.getElementById('review-answer-area');
    const submitAnswerBtn = document.getElementById('submit-answer-btn');
    const nextCardBtn = document.getElementById('next-card-btn');
    const feedbackMessage = document.getElementById('feedback-message');

    // Later View
    const laterList = document.getElementById('later-list');
    const laterPlaceholder = document.getElementById('later-placeholder');
    const reviewLaterBtn = document.getElementById('review-later-btn');

    // Import/Export
    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file-input');
    const exportBtn = document.getElementById('export-btn');
    
    // Edit Modal
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editCardId = document.getElementById('edit-card-id');
    const editCardSource = document.getElementById('edit-card-source');
    const editQuestion = document.getElementById('edit-question');
    const editQuestionType = document.getElementById('edit-question-type');
    const editMcOptionsContainer = document.getElementById('edit-mc-options-container');
    const editMcOptionsList = document.getElementById('edit-mc-options-list');
    const editAddOptionBtn = document.getElementById('edit-add-option-btn');
    const editAnswer = document.getElementById('edit-answer');
    const editAnswerItemContainers = {
        answerElem: document.getElementById('edit-answer-container'),
        itemsElem: document.getElementById('edit-enum-items-container')
    };
    const editEnumItemsList = document.getElementById('edit-enum-items-list');
    const editAddItemBtn = document.getElementById('edit-add-item-btn');
    const editAlternativesContainer = document.getElementById('edit-alternatives-container');
    const editAlternativesList = document.getElementById('edit-alternatives-list');
    const editAddAlternativeBtn = document.getElementById('edit-add-alternative-btn');

    MicroModal.initModal(editModal, {});

    // Confirm & Alert Modals
    const confirmModal = document.getElementById('confirm-modal');
    const cancelRemoveBtn = document.getElementById('cancel-remove-btn');
    const confirmRemoveBtn = document.getElementById('confirm-remove-btn');
    const alertModal = document.getElementById('alert-modal');
    const alertMessage = document.getElementById('alert-message');

    MicroModal.initModal(confirmModal, {});
    MicroModal.initModal(alertModal, {});

    // --- CUSTOM ALERT ---
    function showAlert(message) {
        alertMessage.textContent = message;
        MicroModal.show(alertModal);
    }

    // --- Escape Unsafe HTML Characters ---
    function escapeHTML(str) {
        const replacements = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;' // or &apos;
        };
        return str.replace(/[&<>"']/g, char => replacements[char]);
    }

    // --- NAVIGATION ---
    function switchView(viewId) {
        views.forEach(view => view.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.remove('active-tab', 'text-blue-600', 'border-blue-600');
            btn.classList.add('text-gray-500');
        });
        const activeBtn = document.getElementById(`nav-${viewId.split('-')[0]}`);
        activeBtn.classList.add('active-tab', 'text-blue-600', 'border-blue-600');
        activeBtn.classList.remove('text-gray-500');
        if (viewId === 'review-view') {
            reviewManagementArea.style.display = 'block';
            reviewCardContainer.classList.add('hidden');
            renderReviewList();
        } else if (viewId === 'later-view') {
            renderLaterList();
        }
    }
    navCreate.forEach(item => item.addEventListener('click', () => switchView('create-view')));
    navReview.addEventListener('click', () => switchView('review-view'));
    navLater.addEventListener('click', () => switchView('later-view'));

    // --- DYNAMIC INPUT LISTS (MC & Alternatives) ---
    function createDynamicInput(list, value, placeholderPrefix) {
        const wrapper = document.createElement('div');
        wrapper.className = 'input-wrapper';
        const newInput = document.createElement('input');
        newInput.type = 'text';
        newInput.className = 'dynamic-input flex-grow mt-1 block w-full rounded-md border-gray-300 shadow-sm custom-focus-ring sm:text-sm p-2';
        newInput.value = value;
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.innerHTML = '&times;';
        removeBtn.className = 'text-red-500 font-bold text-2xl hover:text-red-700';
        removeBtn.onclick = () => {
            // Prevent removing below minimum of 2 for MC questions or 1 for Enum item
            if (placeholderPrefix === 'Choice' && list.children.length <= 2) {
                showAlert("A multiple choice question must have at least two choices.");
            } else if (placeholderPrefix === 'Item' && list.children.length <= 1) {
                showAlert("An enumeration question must have at least one item.");
            }  else {
                wrapper.remove();
                updateInputPlaceholders(list, placeholderPrefix);
            }
        };
        wrapper.appendChild(newInput);
        wrapper.appendChild(removeBtn);
        list.appendChild(wrapper);
    }

    function updateInputPlaceholders(list, placeholderPrefix) {
        const inputs = list.querySelectorAll('.dynamic-input');
        inputs.forEach((input, index) => {
            input.placeholder = `${placeholderPrefix} ${index + 1}`;
        });
    }

    function setupDynamicList(list, addBtn, placeholderPrefix, initialItems = []) {
        list.innerHTML = '';
        initialItems.forEach(item => createDynamicInput(list, item, placeholderPrefix));
        updateInputPlaceholders(list, placeholderPrefix);
        addBtn.onclick = () => {
            createDynamicInput(list, "", placeholderPrefix);
            updateInputPlaceholders(list, placeholderPrefix);
        };
    }

    // --- CARD CREATION ---
    function toggleQuestionTypeFields(type, mcContainer, altContainer, enumContainer) {
        mcContainer.classList.toggle('hidden', type !== 'multiple-choice');
        altContainer.classList.toggle('hidden', type !== 'identification');

        const isEnum = type === 'enumeration';
        enumContainer.answerElem.classList.toggle('hidden', isEnum);
        enumContainer.itemsElem.classList.toggle('hidden', !isEnum);
    }

    questionTypeSelect.addEventListener('change', () => toggleQuestionTypeFields(
        questionTypeSelect.value, mcOptionsContainer, alternativesContainer, answerItemContainers));
    editQuestionType.addEventListener('change', () => toggleQuestionTypeFields(
        editQuestionType.value, editMcOptionsContainer, editAlternativesContainer, editAnswerItemContainers));

    createForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const question = questionInput.value.trim();
        const type = questionTypeSelect.value;
        const newCard = { id: Date.now(), question, type, alternatives: [] };
        let answer;

        if (type === 'enumeration') {
            answer = [...answerItemContainers.itemsElem.querySelectorAll('.dynamic-input')].map(opt => opt.value.trim()).filter(Boolean);
            if (!question || answer.length < 1) {
                showAlert('Please fill in the question and at least one item.'); return;
            }
            
            let isOrdered = document.getElementById('enumeration-order').checked;

            // Check for duplicates if not ordered
            if (!isOrdered) {
                const uniqueAnswers = new Set(answer.map(a => a.toLowerCase()));
                if (uniqueAnswers.size !== answer.length) {
                    showAlert('For unordered enumerations, please make sure there are no duplicate items.'); return;
                }
            }
            newCard.answer = answer;
            newCard.ordered = isOrdered;
        } else {
            answer = answerInput.value.trim();
            if (!question || !answer) {
                showAlert('Please fill in the question and answer.'); return;
            }
            newCard.answer = answer;
        }

        if (type === 'multiple-choice') {
            const options = [...mcOptionsList.querySelectorAll('.dynamic-input')].map(opt => opt.value.trim()).filter(Boolean);
            if (options.length < 2) { showAlert('Please provide at least two choices.'); return; }
            if (!options.map(o => o.toLowerCase()).includes(answer.toLowerCase())) { 
                showAlert('The correct answer must be one of the choices.'); return; 
            }
            newCard.options = options;
        } else if (type === 'identification') {
            newCard.alternatives = [...alternativesList.querySelectorAll('.dynamic-input')].map(alt => alt.value.trim()).filter(Boolean);
        }

        flashcards.push(newCard);
        showAlert('Flashcard created!');
        createForm.reset();
        toggleQuestionTypeFields('identification', mcOptionsContainer, alternativesContainer, answerItemContainers);
        setupDynamicList(mcOptionsList, addOptionBtn, 'Choice', ["", ""]);
        setupDynamicList(enumItemsList, addItemBtn, 'Item', ["", "", ""]);
        setupDynamicList(alternativesList, addAlternativeBtn, 'Alternative', []);
        renderReviewList();
    });

    // --- CARD LIST RENDERING & MANAGEMENT ---
    function renderCardList(cardArray, listElement, placeholder, source) {
        listElement.innerHTML = '';
        if (cardArray.length === 0) {
            placeholder.style.display = 'block'; return;
        }
        placeholder.style.display = 'none';
        cardArray.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center';
            const questionText = document.createElement('p');
            questionText.textContent = card.question;
            questionText.className = 'truncate mr-4';
            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'flex-shrink-0 flex gap-2';
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.className = 'text-sm font-medium text-blue-600 hover:text-blue-800';
            editBtn.onclick = () => openEditModal(card.id, source);
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.className = 'text-sm font-medium text-red-600 hover:text-red-800';
            removeBtn.onclick = () => openConfirmModal(card.id, source);
            buttonsDiv.appendChild(editBtn);
            buttonsDiv.appendChild(removeBtn);
            cardEl.appendChild(questionText);
            cardEl.appendChild(buttonsDiv);
            listElement.appendChild(cardEl);
        });
    }
    function renderReviewList() {
        renderCardList(flashcards, reviewList, reviewListPlaceholder, 'flashcards');
        startReviewBtn.classList.toggle('hidden', flashcards.length === 0);
    }
    function renderLaterList() {
        renderCardList(forLater, laterList, laterPlaceholder, 'forLater');
        reviewLaterBtn.classList.toggle('hidden', forLater.length === 0);
    }

    // --- REVIEW SESSION ---
    startReviewBtn.addEventListener('click', startReview);
    function startReview() {
        currentReviewDeck = [...flashcards].sort(() => Math.random() - 0.5);
        currentCardIndex = 0;
        answeredItems = { correct: true, items: [] };
        reviewManagementArea.style.display = 'none';
        reviewCardContainer.classList.remove('hidden');
        displayCard();
    }
    function displayCard() {
        if (currentCardIndex >= currentReviewDeck.length) { endReviewSession(); return; }
        const card = currentReviewDeck[currentCardIndex];
        reviewProgress.textContent = (currentCardIndex + 1) + " / " + currentReviewDeck.length;
        reviewQuestion.textContent = card.question;
        reviewAnswerArea.innerHTML = '';
        feedbackMessage.innerHTML = ''; // Use innerHTML to clear divs
        feedbackMessage.className = 'mt-4 font-medium p-3 rounded-lg'; // Reset and apply base styles
        let userAnswerInput;

        if (card.type !== 'multiple-choice') {
            // For identification and enumeration
            reviewAnswerArea.innerHTML = `<input type="text" id="user-answer" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm custom-focus-ring sm:text-sm p-2">`;

            userAnswerInput = document.getElementById('user-answer');
            if (card.type === 'enumeration') {
                userAnswerInput.placeholder = `Answer 1 of ${card.answer.length}`;
            } else {
                userAnswerInput.placeholder = 'Type your answer here...'; // Identification
            }

            userAnswerInput.focus();
        } else {
            const shuffledOptions = [...card.options].sort(() => Math.random() - 0.5);
            let optionsHTML = '<div id="user-answer" class="space-y-2">';
            shuffledOptions.forEach((option, index) => {
                optionsHTML += `<div class="flex items-center"><input id="mc-${index}" name="mc-answer" type="radio" value="${escapeHTML(option)}" class="h-4 w-4 text-blue-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300"><label for="mc-${index}" class="ml-3 block text-sm font-medium text-gray-700">${escapeHTML(option)}</label></div>`;
            });
            optionsHTML += '</div>';
            reviewAnswerArea.innerHTML = optionsHTML;

            userAnswerInput = document.getElementById('user-answer');
            document.getElementById('mc-0').focus(); // Focus the first choice
        }
        userAnswerInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                if (!submitAnswerBtn.classList.contains("hidden")) checkAnswer();
                else {
                    // Next card
                    currentCardIndex++;
                    answeredItems = { correct: true, items: [] };
                    displayCard();
                }
            }
        });

        submitAnswerBtn.classList.remove('hidden');
        nextCardBtn.classList.add('hidden');
    }
    submitAnswerBtn.addEventListener('click', checkAnswer);
    nextCardBtn.addEventListener('click', () => { currentCardIndex++; answeredItems = { correct: true, items: [] }; displayCard(); });
    
    function checkAnswer() {
        const card = currentReviewDeck[currentCardIndex];
        let userAnswer;
        if (card.type !== 'multiple-choice') {
            // Identification and enumeration
            userAnswer = document.getElementById('user-answer').value.trim();
        } else {
            const checkedRadio = document.querySelector('input[name="mc-answer"]:checked');
            userAnswer = checkedRadio ? checkedRadio.value : '';
        }
        if (!userAnswer) { showAlert("Please provide an answer."); return; }
        
        if (card.type === 'enumeration') {
            handleEnumerationCheck(card, userAnswer);
            return;
        }
        
        let isCorrect = false;
        if (card.type === 'identification') {
            const allAnswers = [card.answer, ...(card.alternatives || [])].map(a => a.toLowerCase());
            isCorrect = allAnswers.includes(userAnswer.toLowerCase());
        } else { // Multiple-choice
            isCorrect = userAnswer.toLowerCase() === card.answer.toLowerCase();
        }

        if (isCorrect) {
            feedbackMessage.textContent = "✅ Correct! Great job!";
            feedbackMessage.classList.add('bg-green-100', 'text-green-700');
            const cardToMoveIndex = flashcards.findIndex(fc => fc.id === card.id);

            if (cardToMoveIndex > -1) forLater.push(flashcards.splice(cardToMoveIndex, 1)[0]);
        } else {
            let correctAnswerText = card.answer;
            if (card.type === 'identification' && card.alternatives && card.alternatives.length > 0) {
                correctAnswerText = [card.answer, ...card.alternatives].join(' / ');
            }
            feedbackMessage.innerHTML = `❌ Not quite. The correct answer is: <strong>${escapeHTML(correctAnswerText)}</strong>`;
            feedbackMessage.classList.add('bg-red-100', 'text-red-700');
        }
        submitAnswerBtn.classList.add('hidden');
        nextCardBtn.classList.remove('hidden');
        nextCardBtn.focus();
    }

    function handleEnumerationCheck(card, userAnswer) {
        const isOrdered = card.ordered || false;
        const lowerCaseCorrectAnswers = card.answer.map(a => a.toLowerCase());
        const userAnswerInput = document.getElementById('user-answer');
        const userAnswerLower = userAnswer.toLowerCase();

        // Prevent duplicate entries for unordered lists
        if (!isOrdered && answeredItems.items.includes(userAnswerLower)) {
            showAlert(`You have already entered "${userAnswer}".`);
            userAnswerInput.value = "";
            return;
        }

        let isItemCorrect = false;

        if (isOrdered) {
            const nextCorrectIndex = answeredItems.items.length;
            // Check if the user's answer matches the next item in the correct sequence
            if (nextCorrectIndex < lowerCaseCorrectAnswers.length && userAnswerLower === lowerCaseCorrectAnswers[nextCorrectIndex]) {
                isItemCorrect = true;
            }
        } else {
            // For unordered, check if the answer is in the list and hasn't been given yet
            if (lowerCaseCorrectAnswers.includes(userAnswerLower) && !answeredItems.items.includes(userAnswerLower)) {
                isItemCorrect = true;
            }
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'inline-block bg-gray-50 m-1 p-1 rounded-md border border-gray-200';

        wrapper.textContent = `${isItemCorrect ? '✅' : '❌'} ${userAnswer}`;
        wrapper.classList.add(isItemCorrect ? 'text-green-600' : 'text-red-600');

        answeredItems.items.push(userAnswerLower); // Add this answer to the list of your answers
        if (!isItemCorrect) answeredItems.correct = false; // If the item is wrong, mark the whole card as incorrect
        
        feedbackMessage.appendChild(wrapper);

        // Check if the card is complete (all items have been correctly identified)
        if (answeredItems.items.length >= card.answer.length) {
            const finalWrapper = document.createElement('div');
            finalWrapper.className = 'mt-2 font-medium p-3 rounded-lg';

            if (answeredItems.correct) {
                finalWrapper.textContent = "✅ All correct! Great job!";
                finalWrapper.classList.add('bg-green-100', 'text-green-700');
                // Move card to 'forLater'
                const cardToMoveIndex = flashcards.findIndex(fc => fc.id === card.id);
                if(cardToMoveIndex > -1) {
                    forLater.push(flashcards[cardToMoveIndex]);
                    flashcards.splice(cardToMoveIndex, 1);
                }
            } else {
                let correctAnswerText = card.answer.map(a => escapeHTML(a)).join(isOrdered ? ' → ' : ', ');
                finalWrapper.innerHTML = `Not quite. The correct answer${isOrdered ? ' sequence' : 's are'}: <strong>${correctAnswerText}</strong>`;
                finalWrapper.classList.add('bg-red-100', 'text-red-700');
            }
            feedbackMessage.appendChild(finalWrapper);

            submitAnswerBtn.classList.add('hidden');
            nextCardBtn.classList.remove('hidden');
            nextCardBtn.focus();
        } else {
            userAnswerInput.placeholder = `Answer ${answeredItems.items.length + 1} of ${card.answer.length}`;
            userAnswerInput.value = "";
            userAnswerInput.focus();
        }
    }

    function endReviewSession() {
        reviewManagementArea.style.display = 'block';
        reviewCardContainer.classList.add('hidden');
        renderReviewList();
        renderLaterList();
    }

    // --- "FOR LATER" & IMPORT/EXPORT ---
    reviewLaterBtn.addEventListener('click', () => {
        flashcards = [...flashcards, ...forLater];
        forLater = [];
        renderLaterList();
        renderReviewList();
        showAlert("Cards moved back to the main review deck.");
        switchView('review-view');
    });
    importBtn.addEventListener('click', () => importFileInput.click());
    exportBtn.addEventListener('click', () => {
        if (flashcards.length === 0 && forLater.length === 0) { showAlert("No cards to export."); return; }
        const data = JSON.stringify({ flashcards, forLater }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'flashcards.json'; a.click();
        URL.revokeObjectURL(url);
    });
    importFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data.flashcards) && Array.isArray(data.forLater)) {
                    flashcards = data.flashcards;
                    forLater = data.forLater;
                    renderReviewList(); renderLaterList();
                    showAlert('Flashcards imported successfully!');
                } else { showAlert('Invalid JSON file format.'); }
            } catch (error) { showAlert('Error reading or parsing the file.'); }
        };
        reader.readAsText(file);
        importFileInput.value = '';
    });

    // --- MODALS (EDIT & CONFIRM) ---
    function openEditModal(id, source) {
        const sourceArray = source === 'flashcards' ? flashcards : forLater;
        const card = sourceArray.find(c => c.id === id);
        if (!card) return;
        editCardId.value = id;
        editCardSource.value = source;
        editQuestion.value = card.question;
        editQuestionType.value = card.type;

        toggleQuestionTypeFields(card.type, editMcOptionsContainer, editAlternativesContainer, editAnswerItemContainers);
        
        if (card.type === 'enumeration') {
            setupDynamicList(editEnumItemsList, editAddItemBtn, 'Item', card.answer || ["", "", ""]);
            document.getElementById('edit-enumeration-order').checked = card.ordered || false;
        } else {
            editAnswer.value = card.answer;
        }

        if (card.type === 'multiple-choice') {
            setupDynamicList(editMcOptionsList, editAddOptionBtn, 'Choice', card.options || ["", ""]);
        } else if (card.type === 'identification') {
            setupDynamicList(editAlternativesList, editAddAlternativeBtn, 'Alternative', card.alternatives || []);
        }
        MicroModal.show(editModal);
    }
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = parseInt(editCardId.value);
        const source = editCardSource.value;
        const sourceArray = source === 'flashcards' ? flashcards : forLater;
        const cardIndex = sourceArray.findIndex(c => c.id === id);
        if (cardIndex === -1) return;

        const updatedCard = { ...sourceArray[cardIndex] };
        updatedCard.question = editQuestion.value.trim();
        updatedCard.type = editQuestionType.value;
        updatedCard.alternatives = [];
        delete updatedCard.options;

        if (updatedCard.type === 'enumeration') {
            updatedCard.answer = [...editAnswerItemContainers.itemsElem.querySelectorAll('.dynamic-input')].map(opt => opt.value.trim()).filter(Boolean);
            updatedCard.ordered = document.getElementById('edit-enumeration-order').checked;
        } else {
            updatedCard.answer = editAnswer.value.trim();
        }

        if (updatedCard.type === 'multiple-choice') {
            const options = [...editMcOptionsList.querySelectorAll('.dynamic-input')].map(opt => opt.value.trim()).filter(Boolean);
            if (options.length < 2) { showAlert('Please provide at least two choices.'); return; }
            if (!options.map(o=>o.toLowerCase()).includes(updatedCard.answer.toLowerCase())) { showAlert('The correct answer must be one of the choices.'); return; }
            updatedCard.options = options;
        } else if (updatedCard.type === 'identification') {
            updatedCard.alternatives = [...editAlternativesList.querySelectorAll('.dynamic-input')].map(alt => alt.value.trim()).filter(Boolean);
        }
        sourceArray[cardIndex] = updatedCard;
        MicroModal.close(editModal);
        if (source === 'flashcards') renderReviewList(); else renderLaterList();
    });
    function openConfirmModal(id, source) {
        cardToRemove = { id, source };
        MicroModal.show(confirmModal);
    }
    confirmRemoveBtn.addEventListener('click', () => {
        const { id, source } = cardToRemove;
        if (source === 'flashcards') {
            flashcards = flashcards.filter(c => c.id !== id);
            renderReviewList();
        } else {
            forLater = forLater.filter(c => c.id !== id);
            renderLaterList();
        }
    });

    // --- INITIALIZE ---
    toggleQuestionTypeFields('identification', mcOptionsContainer, alternativesContainer, answerItemContainers);
    setupDynamicList(mcOptionsList, addOptionBtn, 'Choice', ["", ""]);
    setupDynamicList(enumItemsList, addItemBtn, 'Item', ["", "", ""]);
    setupDynamicList(alternativesList, addAlternativeBtn, 'Alternative', []);

    setupDynamicList(editMcOptionsList, editAddOptionBtn, 'Choice', ["", ""]);
    setupDynamicList(editEnumItemsList, editAddItemBtn, 'Item', ["", "", ""]);
    setupDynamicList(editAlternativesList, editAddAlternativeBtn, 'Alternative', []);
    switchView('create-view');
});
